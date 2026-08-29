/* =============================================================
 * Draft preview tokens: short-lived, in-memory, single purpose.
 * Swap with signed JWTs + database for production.
 * ============================================================= */

const TTL = 15 * 60_000

const store = new Map<string, { resource: string, id: number, exp: number }>()

function sweep(): void {
  const now = Date.now()
  for (const [token, entry] of store) {
    if (entry.exp <= now) store.delete(token)
  }
}

export function createPreviewToken(resource: string, id: number): { token: string, expiresInMin: number } {
  sweep()
  const token = crypto.randomUUID()
  store.set(token, { resource, id, exp: Date.now() + TTL })
  return { token, expiresInMin: TTL / 60_000 }
}

export function readPreviewToken(token: string | undefined): { resource: string, id: number } | undefined {
  if (!token) return undefined
  sweep()
  const entry = store.get(token)
  if (!entry || entry.exp <= Date.now()) return undefined
  return { resource: entry.resource, id: entry.id }
}

/** preview is allowed for draft-able collections only */
export function isPreviewableResource(resource: string): boolean {
  return resource === 'posts' || resource.startsWith('ct_')
}
