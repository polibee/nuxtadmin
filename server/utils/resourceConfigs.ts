/* =============================================================
 * Server-side resource registry: known fields, types and search
 * columns per resource. Mirrors the client schema for validation.
 * Static configs + runtime content types ("ct_*") created via the
 * Content Type builder.
 * ============================================================= */

import { getCollection } from './db'

interface FieldConfig {
  type: 'string' | 'number' | 'boolean' | 'list'
  required?: boolean
  enum?: string[]
}

export interface ServerResourceConfig {
  label: string
  searchable: string[]
  fields: Record<string, FieldConfig>
  /** permission prefix for write operations, e.g. "users" */
  permissionPrefix: string
  /** fields stripped on update (identity/foreign keys) */
  immutableFields?: string[]
}

export const RESOURCE_CONFIGS: Record<string, ServerResourceConfig> = {
  'users': {
    label: 'User',
    searchable: ['name', 'email'],
    permissionPrefix: 'users',
    fields: {
      name: { type: 'string', required: true },
      email: { type: 'string', required: true },
      role: { type: 'string', enum: ['admin', 'editor', 'viewer'] },
      status: { type: 'string', enum: ['active', 'inactive'] }
    }
  },
  'posts': {
    label: 'Post',
    searchable: ['title', 'slug'],
    permissionPrefix: 'posts',
    fields: {
      title: { type: 'string', required: true },
      slug: { type: 'string', required: true },
      content: { type: 'string' },
      status: { type: 'string', enum: ['draft', 'published', 'archived'] },
      authorId: { type: 'number' },
      views: { type: 'number' },
      publishedAt: { type: 'string' }
    }
  },
  'orders': {
    label: 'Order',
    searchable: ['orderNo', 'customerName'],
    permissionPrefix: 'orders',
    fields: {
      orderNo: { type: 'string' },
      customerName: { type: 'string', required: true },
      amount: { type: 'number', required: true },
      status: { type: 'string', enum: ['pending', 'paid', 'shipped', 'completed', 'refunded'] }
    }
  },
  'roles': {
    label: 'Role',
    searchable: ['name'],
    permissionPrefix: 'roles',
    immutableFields: ['key'],
    fields: {
      name: { type: 'string', required: true },
      key: { type: 'string' },
      permissions: { type: 'list' }
    }
  },
  'media': {
    label: 'Media',
    searchable: ['filename'],
    permissionPrefix: 'media',
    immutableFields: ['filename', 'mime', 'size', 'storageKey', 'url'],
    fields: {
      filename: { type: 'string' },
      mime: { type: 'string' },
      size: { type: 'number' },
      storageKey: { type: 'string' },
      url: { type: 'string' }
    }
  },
  'content-types': {
    label: 'Content Type',
    searchable: ['name'],
    permissionPrefix: 'content-types',
    immutableFields: ['slug'],
    fields: {
      name: { type: 'string', required: true },
      slug: { type: 'string' },
      fields: { type: 'list' }
    }
  }
}

/** build a server config from a stored content type definition */
function dynamicConfig(name: string): ServerResourceConfig | undefined {
  if (!name.startsWith('ct_')) return undefined
  const slug = name.slice(3)
  const type = getCollection('content-types').find(t => t.slug === slug) as
    | { name: string, slug: string, fields: Array<{ name: string, label: string, type: string, required?: boolean, options?: string }> }
    | undefined
  if (!type) return undefined

  const fields: Record<string, FieldConfig> = {}
  const searchable: string[] = []
  for (const field of type.fields) {
    switch (field.type) {
      case 'number':
        fields[field.name] = { type: 'number', required: field.required }
        break
      case 'boolean':
        fields[field.name] = { type: 'boolean', required: field.required }
        break
      case 'select':
        fields[field.name] = {
          type: 'string',
          required: field.required,
          enum: (field.options ?? '').split(',').map(s => s.trim()).filter(Boolean)
        }
        break
      default:
        fields[field.name] = { type: 'string', required: field.required }
        searchable.push(field.name)
    }
  }
  return { label: type.name, searchable, fields, permissionPrefix: 'content' }
}

export function getConfig(name: string): ServerResourceConfig {
  const cfg = RESOURCE_CONFIGS[name] ?? dynamicConfig(name)
  if (!cfg) throw createError({ statusCode: 404, statusMessage: `Unknown resource "${name}"` })
  return cfg
}

type ValidateResult
  = | { ok: true, data: Record<string, unknown> }
    | { ok: false, message: string }

/** create = full validation (required enforced); update = partial */
export function validateInput(
  name: string,
  body: Record<string, unknown>,
  mode: 'create' | 'update'
): ValidateResult {
  const cfg = getConfig(name)
  const data: Record<string, unknown> = {}

  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'Invalid request body' }
  }

  for (const [field, rule] of Object.entries(cfg.fields)) {
    const value = body[field]

    // immutable fields (identity/foreign keys) can only be set on create
    if (mode === 'update' && cfg.immutableFields?.includes(field)) continue

    if (value === undefined || value === null || value === '') {
      if (mode === 'create' && rule.required) {
        return { ok: false, message: `"${field}" is required` }
      }
      continue
    }

    if (rule.type === 'number') {
      const n = Number(value)
      if (Number.isNaN(n)) return { ok: false, message: `"${field}" must be a number` }
      data[field] = n
      continue
    }

    if (rule.type === 'boolean') {
      data[field] = Boolean(value)
      continue
    }

    if (rule.type === 'list') {
      if (!Array.isArray(value)) return { ok: false, message: `"${field}" must be an array` }
      // sanitize: primitives stay as-is; objects keep only primitive props
      data[field] = value.map((item) => {
        if (item === null || typeof item !== 'object') return item
        const clean: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
          if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
            clean[k] = v
          }
        }
        return clean
      })
      continue
    }

    const str = String(value)
    if (rule.enum && !rule.enum.includes(str)) {
      return { ok: false, message: `"${field}" must be one of: ${rule.enum.join(', ')}` }
    }
    data[field] = str
  }

  // unknown keys are never copied into `data`, so the store stays clean

  return { ok: true, data }
}
