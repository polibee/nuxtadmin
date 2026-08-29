import type { CacheConfig } from './runtimeConfig'

/* =============================================================
 * KV cache abstraction: memory (default) or Redis. Used for
 * sessions, preview tokens and autosave drafts - the pieces that
 * benefit from multi-instance deployment.
 * ============================================================= */

export interface KVDriver {
  kind: 'memory' | 'redis'
  get(key: string): Promise<unknown | null>
  set(key: string, value: unknown, ttlSec?: number): Promise<void>
  del(key: string): Promise<void>
}

class MemoryKV implements KVDriver {
  kind = 'memory' as const
  private store = new Map<string, { value: unknown, exp: number }>()

  async get(key: string): Promise<unknown | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.exp && entry.exp <= Date.now()) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  async set(key: string, value: unknown, ttlSec?: number): Promise<void> {
    this.store.set(key, { value, exp: ttlSec ? Date.now() + ttlSec * 1000 : 0 })
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
  }
}

class RedisKV implements KVDriver {
  kind = 'redis' as const
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ioredis types load only with the driver
  private client: any = null

  async init(config: CacheConfig): Promise<void> {
    const Redis = (await import('ioredis')).default
    this.client = config.url
      ? new Redis(config.url)
      : new Redis({ host: config.host, port: config.port, password: config.password || undefined, db: config.db })
    await this.client.ping()
  }

  async get(key: string): Promise<unknown | null> {
    const raw = await this.client.get(key)
    if (raw === null) return null
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }

  async set(key: string, value: unknown, ttlSec?: number): Promise<void> {
    const raw = JSON.stringify(value)
    if (ttlSec) await this.client.set(key, raw, 'EX', ttlSec)
    else await this.client.set(key, raw)
  }

  async del(key: string): Promise<void> {
    await this.client.del(key)
  }
}

let active: KVDriver = new MemoryKV()

export async function initCache(config: CacheConfig): Promise<string> {
  if (config.driver === 'redis') {
    const driver = new RedisKV()
    await driver.init(config)
    active = driver
  } else {
    active = new MemoryKV()
  }
  return active.kind
}

export function getKV(): KVDriver {
  return active
}

export async function testCacheConnection(config: CacheConfig): Promise<{ ok: boolean, kind: string, error?: string }> {
  if (config.driver === 'memory') return { ok: true, kind: 'memory' }
  try {
    const probe = new RedisKV()
    await probe.init(config)
    await probe.set('cache:test:ping', 1, 10)
    await probe.del('cache:test:ping')
    return { ok: true, kind: 'redis' }
  } catch (e: unknown) {
    return { ok: false, kind: config.driver, error: (e as Error).message }
  }
}
