/* =============================================================
 * Server-side resource registry: known fields, types and search
 * columns per resource. Mirrors the client schema for validation.
 * ============================================================= */

interface FieldConfig {
  type: 'string' | 'number' | 'boolean'
  required?: boolean
  enum?: string[]
}

export interface ServerResourceConfig {
  label: string
  searchable: string[]
  fields: Record<string, FieldConfig>
  /** permission prefix for write operations, e.g. "users" */
  permissionPrefix: string
}

export const RESOURCE_CONFIGS: Record<string, ServerResourceConfig> = {
  users: {
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
  posts: {
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
  orders: {
    label: 'Order',
    searchable: ['orderNo', 'customerName'],
    permissionPrefix: 'orders',
    fields: {
      orderNo: { type: 'string' },
      customerName: { type: 'string', required: true },
      amount: { type: 'number', required: true },
      status: { type: 'string', enum: ['pending', 'paid', 'shipped', 'completed', 'refunded'] }
    }
  }
}

export function getConfig(name: string): ServerResourceConfig {
  const cfg = RESOURCE_CONFIGS[name]
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

    const str = String(value)
    if (rule.enum && !rule.enum.includes(str)) {
      return { ok: false, message: `"${field}" must be one of: ${rule.enum.join(', ')}` }
    }
    data[field] = str
  }

  // unknown keys are never copied into `data`, so the store stays clean

  return { ok: true, data }
}
