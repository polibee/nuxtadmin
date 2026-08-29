import { getCollection as readWebhookSubscriptions } from './db'

import { createHmac } from 'node:crypto'

/* =============================================================
 * Webhook dispatch with SSRF protection:
 *  - only http/https
 *  - refuses localhost / loopback / private / reserved addresses
 *  - hostnames are DNS-resolved and every resolved IP re-checked
 *    (mitigates trivial rebinding; a production system should pin
 *    the resolved IP on the actual request as well)
 * ============================================================= */

const V4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/

/** true when the literal host is an IP in a private/reserved range */
export function isPrivateIp(host: string): boolean {
  const m = host.match(V4_RE)
  if (m) {
    const a = Number(m[1])
    const b = Number(m[2])
    if ([a, b].some(n => Number.isNaN(n) || n > 255)) return true
    if (a === 0 || a === 10 || a === 127) return true
    if (a === 169 && b === 254) return true // link-local
    if (a === 172 && b >= 16 && b <= 31) return true // private
    if (a === 192 && b === 168) return true // private
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
    if (a >= 224) return true // multicast + reserved
    return false
  }
  if (host.includes(':')) {
    const h = host.replace(/^\[|\]$/g, '').toLowerCase()
    if (h === '::' || h === '::1') return true
    if (h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd')) return true
    if (h.startsWith('::ffff:')) return isPrivateIp(h.slice(7))
    return false
  }
  return false // not an IP literal; caller resolves DNS separately
}

export type TargetResult
  = | { ok: true, url: URL }
    | { ok: false, message: string }

/** synchronous policy check (scheme + hostname literals) */
export function parseWebhookTarget(raw: unknown): TargetResult {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, message: '"url" is required' }
  }
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return { ok: false, message: '"url" must be a valid URL' }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, message: 'Only http/https webhook URLs are allowed' }
  }
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return { ok: false, message: 'Refusing local hostname' }
  }
  if (isPrivateIp(host)) {
    return { ok: false, message: 'Refusing private/reserved address' }
  }
  return { ok: true, url }
}

/** full runtime check: policy + DNS resolution re-checked against policy */
export async function resolveSafeWebhookUrl(raw: string): Promise<URL> {
  const parsed = parseWebhookTarget(raw)
  if (!parsed.ok) throw new Error(parsed.message)

  const host = parsed.url.hostname.toLowerCase()
  if (!isPrivateIp(host)) {
    const dns = await import('node:dns').then(m => m.promises)
    const addresses = await dns.lookup(host, { all: true }).catch(() => [])
    if (addresses.length === 0) {
      throw new Error(['Webhook host cannot be resolved:', host].join(' '))
    }
    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) {
        throw new Error('Refusing private/reserved address')
      }
    }
  }
  return parsed.url
}

const FIRE_TIMEOUT = 5_000

/** HMAC-SHA256 over the exact JSON body; receivers verify with the shared secret */
export function signPayload(secret: string, body: string): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`
}

export interface DeliveryAttempt {
  ok: boolean
  status?: number
  error?: string
}

/** POST a payload to one webhook record with HMAC signature; returns attempt result */
export async function fireWebhook(hook: Record<string, unknown>, event: string, payload: Record<string, unknown>): Promise<DeliveryAttempt> {
  const target = await resolveSafeWebhookUrl(String(hook.url))

  const body = JSON.stringify({ event, payload, sentAt: new Date().toISOString() })
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-webhook-event': event
  }
  if (hook.secret) {
    headers['x-webhook-secret'] = String(hook.secret)
    headers['x-webhook-signature'] = signPayload(String(hook.secret), body)
  }

  try {
    const response = await fetch(target.toString(), {
      method: 'POST',
      body,
      headers,
      signal: AbortSignal.timeout(FIRE_TIMEOUT)
    })
    await response.arrayBuffer().catch(() => undefined)
    const ok = response.status >= 200 && response.status < 400
    return { ok, status: response.status, error: ok ? undefined : `HTTP ${response.status}` }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message }
  }
}

/* ---------------- retry queue (in-memory, exponential backoff) ---------------- */

const RETRY_DELAYS_MS = [60_000, 300_000, 900_000, 3_600_000] // 1m 5m 15m 60m

interface QueuedDelivery {
  hook: Record<string, unknown>
  event: string
  payload: Record<string, unknown>
  attempts: number
  nextAttemptAt: number
}

const retryQueue: QueuedDelivery[] = []

export function queueRetry(hook: Record<string, unknown>, event: string, payload: Record<string, unknown>, failedAttempt: number): void {
  if (failedAttempt > RETRY_DELAYS_MS.length) {
    console.error('[webhook] dropping delivery after', failedAttempt - 1, 'retries:', String(hook.url))
    return
  }
  retryQueue.push({
    hook,
    event,
    payload,
    attempts: failedAttempt,
    nextAttemptAt: Date.now() + (RETRY_DELAYS_MS[failedAttempt - 1] ?? 3_600_000)
  })
}

/** process due retries; called periodically by the scheduler plugin */
export async function processRetryQueue(): Promise<void> {
  const now = Date.now()
  const due = retryQueue.filter(q => q.nextAttemptAt <= now)
  for (const queued of due) {
    retryQueue.splice(retryQueue.indexOf(queued), 1)
    const attempt = await fireWebhook(queued.hook, queued.event, queued.payload)
    if (!attempt.ok) {
      queueRetry(queued.hook, queued.event, queued.payload, queued.attempts + 1)
    } else {
      console.error('[webhook] retry succeeded for', String(queued.hook.url))
    }
  }
}

export function retryQueueSize(): number {
  return retryQueue.length
}

/** fire all subscribed webhooks; failures are queued for retry */
export async function dispatchWebhooks(event: string, payload: Record<string, unknown>): Promise<void> {
  const rows = readWebhookSubscriptions('webhooks').filter(w =>
    w.enabled === true
    && String(w.url ?? '')
    && (String(w.events ?? '').split(',').map(s => s.trim()).includes(event)
      || String(w.events ?? '').split(',').map(s => s.trim()).includes('*'))
  )
  if (rows.length === 0) return

  await Promise.allSettled(rows.map(async (hook) => {
    const attempt = await fireWebhook(hook, event, payload)
    if (!attempt.ok) {
      console.error('[webhook] delivery failed, queued for retry:', String(hook.url), attempt.error ?? '')
      queueRetry(hook, event, payload, 1)
    }
  }))
}
