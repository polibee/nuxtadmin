/* =============================================================
 * Runtime configuration readers: environment variables take
 * precedence over admin-configured settings. Secrets are only ever
 * sourced from settings (secret type) or environment - never literals.
 * ============================================================= */

import { getCollection } from './db'

function setting(key: string, fallback = ''): string {
  const row = getCollection('settings').find(s => s.key === key)
  return row ? String(row.value ?? fallback) : fallback
}

function envish(key: string, settingKey: string, fallback = ''): string {
  return process.env[key] ?? setting(settingKey) ?? fallback
}

export type DbDriver = 'memory' | 'postgres' | 'mysql' | 'supabase'

export interface DbConfig {
  driver: DbDriver
  /** full connection string; when set it wins over discrete fields */
  url: string
  host: string
  port: number
  database: string
  user: string
  hasPassword: boolean
  ssl: boolean
  seedDemo: boolean
}

export function readDbConfig(): DbConfig {
  const raw = envish('DB_DRIVER', 'DB_DRIVER', 'memory')
  const driver = (['postgres', 'mysql', 'supabase'].includes(raw) ? raw : 'memory') as DbDriver
  const url = process.env.DATABASE_URL ?? setting('DATABASE_URL')
  return {
    driver,
    url,
    host: envish('DB_HOST', 'DB_HOST', 'localhost'),
    port: Number(envish('DB_PORT', 'DB_PORT', driver === 'mysql' ? '3306' : '5432')) || (driver === 'mysql' ? 3306 : 5432),
    database: envish('DB_NAME', 'DB_NAME', 'nuxt_admin'),
    user: envish('DB_USER', 'DB_USER'),
    hasPassword: (process.env.DB_PASSWORD ?? setting('DB_PASSWORD') ?? '').length > 0,
    ssl: (envish('DB_SSL', 'DB_SSL', driver === 'supabase' ? 'true' : 'false')) === 'true',
    seedDemo: (envish('SEED_DEMO', 'SEED_DEMO', 'true')) === 'true'
  }
}

export interface CacheConfig {
  driver: 'memory' | 'redis'
  url: string
  host: string
  port: number
  password: string
  db: number
}

export function readCacheConfig(): CacheConfig {
  const raw = envish('CACHE_DRIVER', 'CACHE_DRIVER', 'memory')
  return {
    driver: raw === 'redis' ? 'redis' : 'memory',
    url: process.env.REDIS_URL ?? setting('REDIS_URL'),
    host: envish('REDIS_HOST', 'REDIS_HOST', 'localhost'),
    port: Number(envish('REDIS_PORT', 'REDIS_PORT', '6379')) || 6379,
    password: process.env.REDIS_PASSWORD ?? setting('REDIS_PASSWORD'),
    db: Number(envish('REDIS_DB', 'REDIS_DB', '0')) || 0
  }
}

export function buildConnectionString(db: DbConfig): string {
  if (db.url) return db.url
  const auth = db.user ? `${encodeURIComponent(db.user)}:${encodeURIComponent(process.env.DB_PASSWORD ?? setting('DB_PASSWORD'))}@` : ''
  return `postgres://${auth}${db.host}:${db.port}/${db.database}${db.ssl ? '?sslmode=require' : ''}`
}
