import { createError } from 'h3'
import { persistUpsert } from './store'
import type { Paginated } from '#shared/types/api'

/* =============================================================
 * In-memory data layer (demo/dev). Collections live in a registry
 * so runtime-created content types ("ct_*") work out of the box.
 * Swap with a real repository (Drizzle/Prisma/Kysely...) without
 * touching the API handlers.
 * ============================================================= */

export interface UserRow {
  id: number
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  status: 'active' | 'inactive'
  createdAt: string
}

export interface PostRow {
  id: number
  title: string
  slug: string
  content: string
  status: 'draft' | 'published' | 'archived'
  authorId: number
  views: number
  publishedAt: string | null
  createdAt: string
}

export interface OrderRow {
  id: number
  orderNo: string
  customerName: string
  amount: number
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'refunded'
  createdAt: string
}

export interface RoleRow {
  id: number
  name: string
  key: string
  permissions: string[]
}

export interface MediaRow {
  id: number
  filename: string
  mime: string
  size: number
  /** storage key under useStorage('media'); null for external/seeded urls */
  storageKey: string | null
  url: string
  createdAt: string
}

export interface ContentTypeField {
  name: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'date'
  required?: boolean
  /** csv options for type=select */
  options?: string
}

export interface ContentTypeRow {
  id: number
  name: string
  slug: string
  fields: ContentTypeField[]
  createdAt: string
}

/* ---------------- seed helpers ---------------- */

function iso(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86_400_000).toISOString()
}

const FIRST_NAMES = ['Ada', 'Linus', 'Grace', 'Alan', 'Barbara', 'Dennis', 'Margaret', 'Ken', 'Radia', 'Tim', 'Anita', 'Guido', 'Sophie', 'Bjarne', 'Hedy', 'James']
const LAST_NAMES = ['Lovelace', 'Torvalds', 'Hopper', 'Turing', 'Liskov', 'Ritchie', 'Hamilton', 'Thompson', 'Perlman', 'Berners-Lee', 'Borg', 'van Rossum', 'Wilson', 'Stroustrup', 'Lamarr', 'Gosling']
const ROLES = ['admin', 'editor', 'viewer'] as const

function pick<T>(list: readonly T[], i: number): T {
  return list[i % list.length]!
}

function seedUsers(): UserRow[] {
  return FIRST_NAMES.map((first, i) => ({
    id: i + 1,
    name: `${first} ${pick(LAST_NAMES, i)}`,
    email: `${first.toLowerCase()}${i + 1}@example.com`,
    role: pick(ROLES, i),
    status: i % 7 === 3 ? ('inactive' as const) : ('active' as const),
    createdAt: iso(i * 9 + 2)
  }))
}

const POST_TITLES = [
  'Getting Started with Nuxt 4', 'Understanding Vue Reactivity', 'Tailwind CSS v4 Deep Dive',
  'Admin Design Patterns', 'TypeScript Tips for Frameworks', 'Building Admin Panels Fast',
  'Schema-driven UI Development', 'Server-driven Tables', 'Permission Models Compared',
  'Zod Validation Strategies', 'Composable Architecture', 'Nitro Server Basics',
  'Dark Mode Done Right', 'Auto-imports Explained', 'Form Engines Compared',
  'Widget Systems 101', 'Action Pipelines', 'Navigation Design',
  'Module Boundaries', 'Registry Pattern', 'Declarative CRUD', 'Panel Configuration',
  'Infolist Rendering', 'Bulk Operations UX'
]

function seedPosts(): PostRow[] {
  const statuses = ['published', 'draft', 'archived'] as const
  return POST_TITLES.map((title, i) => ({
    id: i + 1,
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    content: `# ${title}\n\nThis is demo content generated for the admin framework.`,
    status: pick(statuses, i % 5 === 4 ? 2 : i % 2),
    authorId: (i % 16) + 1,
    views: ((i * 137) % 4200) + 60,
    publishedAt: i % 5 === 4 ? null : iso((i % 30) + 1),
    createdAt: iso(i * 3 + 5)
  }))
}

const CUSTOMERS = ['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Stark Industries', 'Wayne Enterprises', 'Cyberdyne', 'Soylent', 'Hooli', 'Pied Piper']

function seedOrders(): OrderRow[] {
  const statuses = ['pending', 'paid', 'shipped', 'completed', 'refunded'] as const
  return Array.from({ length: 42 }, (_, i) => ({
    id: i + 1,
    orderNo: `ORD-${String(2400 + i).padStart(5, '0')}`,
    customerName: pick(CUSTOMERS, i),
    amount: Math.round(((i * 173) % 1800 + 25) * 100) / 100,
    status: pick(statuses, i === 7 ? 4 : i % 4),
    // spread over last ~10 weeks for the revenue chart
    createdAt: new Date(Date.now() - ((i * 41) % 70) * 86_400_000 - (i % 12) * 3_600_000).toISOString()
  }))
}

function seedRoles(): RoleRow[] {
  return [
    { id: 1, name: 'Administrator', key: 'admin', permissions: ['*'] },
    {
      id: 2,
      name: 'Editor',
      key: 'editor',
      permissions: [
        'posts.view', 'posts.create', 'posts.edit', 'posts.delete',
        'orders.view', 'users.view',
        'media.view', 'media.create', 'media.edit', 'media.delete',
        'content.view', 'content.create', 'content.edit', 'content.delete'
      ]
    },
    {
      id: 3,
      name: 'Viewer',
      key: 'viewer',
      permissions: ['users.view', 'posts.view', 'orders.view', 'media.view', 'content.view']
    }
  ]
}

function seedMedia(): MediaRow[] {
  return Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    filename: `demo-banner-${i + 1}.jpg`,
    mime: 'image/jpeg',
    size: 120_000 + i * 8_500,
    storageKey: null,
    url: `https://picsum.photos/seed/nuxtadmin-${i + 1}/240/240`,
    createdAt: iso(i * 2 + 1)
  }))
}

export interface TaxonomyRow {
  id: number
  name: string
  key: 'category' | 'tag'
  slug: string
  parentId: number | null
}

function seedTaxonomy(): TaxonomyRow[] {
  const rows: TaxonomyRow[] = [
    { id: 1, name: 'Technology', key: 'category', slug: 'technology', parentId: null },
    { id: 2, name: 'AI', key: 'category', slug: 'ai', parentId: 1 },
    { id: 3, name: 'LLM', key: 'category', slug: 'llm', parentId: 2 },
    { id: 4, name: 'Computer Vision', key: 'category', slug: 'computer-vision', parentId: 2 },
    { id: 5, name: 'GPU', key: 'category', slug: 'gpu', parentId: 1 },
    { id: 6, name: 'Design', key: 'category', slug: 'design', parentId: null },
    { id: 7, name: 'Business', key: 'category', slug: 'business', parentId: null },
    { id: 8, name: 'startup', key: 'tag', slug: 'startup', parentId: null },
    { id: 9, name: 'tutorial', key: 'tag', slug: 'tutorial', parentId: null },
    { id: 10, name: 'release', key: 'tag', slug: 'release', parentId: null }
  ]
  return rows
}

export interface MenuItem {
  label: string
  url: string
  children?: MenuItem[]
}

export interface MenuRow {
  id: number
  name: string
  location: 'header' | 'footer' | 'custom'
  items: MenuItem[]
}

function seedMenus(): MenuRow[] {
  return [
    {
      id: 1,
      name: 'Main Navigation',
      location: 'header',
      items: [
        { label: 'Home', url: '/' },
        { label: 'Blog', url: '/blog', children: [
          { label: 'Technology', url: '/blog/technology' },
          { label: 'Design', url: '/blog/design' }
        ] },
        { label: 'About', url: '/about' }
      ]
    },
    {
      id: 2,
      name: 'Footer',
      location: 'footer',
      items: [
        { label: 'Privacy', url: '/privacy' },
        { label: 'Terms', url: '/terms' }
      ]
    }
  ]
}

export interface SettingRow {
  id: number
  key: string
  value: string | number | boolean
  type: 'string' | 'text' | 'number' | 'boolean' | 'secret'
  group: string
  public: boolean
  description?: string
}

function seedSettings(): SettingRow[] {
  return [
    { id: 1, key: 'SITE_NAME', value: 'Nuxt Admin', type: 'string', group: 'General', public: true, description: 'Shown in the site header and <title>.' },
    { id: 2, key: 'SITE_URL', value: 'https://example.com', type: 'string', group: 'General', public: true, description: 'Canonical origin of the site.' },
    { id: 3, key: 'SITE_DESCRIPTION', value: 'A Strapi-class CMS built on Nuxt.', type: 'text', group: 'General', public: true },
    { id: 4, key: 'POSTS_PER_PAGE', value: 12, type: 'number', group: 'Blog', public: true },
    { id: 5, key: 'SMTP_HOST', value: 'smtp.internal.example', type: 'string', group: 'Email', public: false },
    { id: 6, key: 'SMTP_PASSWORD', value: 'demo-password-123', type: 'secret', group: 'Email', public: false, description: 'Never exposed by the public settings endpoint.' },
    { id: 7, key: 'CACHE_DRIVER', value: 'memory', type: 'string', group: 'Cache', public: false },
    { id: 8, key: 'MAINTENANCE_MODE', value: false, type: 'boolean', group: 'General', public: true }
  ]
}

/* ---------------- collection registry ---------------- */

type AnyRow = Record<string, unknown>

const SEEDED: Record<string, AnyRow[]> = {
  'users': seedUsers() as unknown as AnyRow[],
  'posts': seedPosts() as unknown as AnyRow[],
  'orders': seedOrders() as unknown as AnyRow[],
  'roles': seedRoles() as unknown as AnyRow[],
  'media': seedMedia() as unknown as AnyRow[],
  'content-types': [],
  'revisions': [],
  'webhooks': [],
  'taxonomy': seedTaxonomy() as unknown as AnyRow[],
  'menus': seedMenus() as unknown as AnyRow[],
  'settings': seedSettings() as unknown as AnyRow[]
}

const collections = new Map<string, AnyRow[]>(Object.entries(SEEDED))
const sequences = new Map<string, number>(
  Object.entries(SEEDED).map(([name, rows]) => [name, rows.length])
)

/** seeded collections + runtime content collections (ct_*) */
function isKnown(name: string): boolean {
  return collections.has(name) || name.startsWith('ct_')
}

export function listCollectionNames(): string[] {
  return [...collections.keys()]
}

/** boot-time import of a persisted row (keeps its id, bumps the sequence) */
export function importRow(resource: string, row: AnyRow): void {
  if (!isKnown(resource)) return
  const rows = getCollection(resource)
  rows.push(row)
  const id = Number(row.id)
  if (Number.isFinite(id)) {
    sequences.set(resource, Math.max(sequences.get(resource) ?? 0, id))
  }
}

export function clearCollection(resource: string): void {
  const rows = getCollection(resource)
  rows.length = 0
  sequences.set(resource, 0)
}

/** re-seed demo content into collections that are completely empty */
export function ensureSeeded(): void {
  const builders: Record<string, () => AnyRow[]> = {
    users: () => seedUsers() as unknown as AnyRow[],
    posts: () => seedPosts() as unknown as AnyRow[],
    orders: () => seedOrders() as unknown as AnyRow[],
    roles: () => seedRoles() as unknown as AnyRow[],
    media: () => seedMedia() as unknown as AnyRow[]
  }
  for (const [name, build] of Object.entries(builders)) {
    if (getCollection(name).length === 0) {
      for (const row of build()) {
        importRow(name, row)
        persistUpsert(name, Number(row.id), row)
      }
    }
  }
}

export function getCollection(name: string): AnyRow[] {
  if (!isKnown(name)) {
    throw createError({ statusCode: 404, statusMessage: `Unknown resource "${name}"` })
  }
  let rows = collections.get(name)
  if (!rows) {
    rows = []
    collections.set(name, rows)
    sequences.set(name, 0)
  }
  return rows
}

export function insertRow(name: string, data: Record<string, unknown>): Record<string, unknown> {
  const rows = getCollection(name)
  const nextId = (sequences.get(name) ?? 0) + 1
  sequences.set(name, nextId)
  const row = { ...data, id: nextId, createdAt: new Date().toISOString() }
  rows.unshift(row)
  persistUpsert(name, nextId, row)
  return row
}

export function findRow(name: string, id: number): Record<string, unknown> {
  const row = getCollection(name).find(r => r.id === id)
  if (!row) throw createError({ statusCode: 404, statusMessage: `${name} #${id} not found` })
  return row
}

export function updateRow(name: string, id: number, patch: Record<string, unknown>): Record<string, unknown> {
  const row = findRow(name, id)
  Object.assign(row, patch)
  persistUpsert(name, id, row)
  return row
}

export function deleteRows(name: string, ids: number[]): number {
  const rows = getCollection(name)
  const set = new Set(ids)
  const kept = rows.filter(r => typeof r.id === 'number' && !set.has(r.id))
  const removed = rows.length - kept.length
  collections.set(name, kept)
  return removed
}

export function findRoleByKey(key: string): RoleRow | undefined {
  return getCollection('roles').find(r => r.key === key) as unknown as RoleRow | undefined
}

/* ---------------- query engine ---------------- */

export interface QueryConfig {
  searchable: string[]
}

export function applyQuery(
  name: string,
  query: { q?: string, page?: number, perPage?: number, sortBy?: string, sortDir?: string },
  config: QueryConfig
): Paginated<Record<string, unknown>> {
  let rows = [...getCollection(name)]

  const term = query.q?.trim().toLowerCase()
  if (term) {
    rows = rows.filter(row =>
      config.searchable.some(field =>
        String(row[field] ?? '').toLowerCase().includes(term)
      )
    )
  }

  const sortBy = query.sortBy && rows[0] && query.sortBy in rows[0] ? query.sortBy : 'id'
  const dir = query.sortDir === 'asc' ? 1 : -1
  rows.sort((a, b) => {
    const av = a[sortBy]
    const bv = b[sortBy]
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av ?? '').localeCompare(String(bv ?? '')) * dir
  })

  const page = Math.max(Number(query.page) || 1, 1)
  const perPage = Math.min(Math.max(Number(query.perPage) || 10, 1), 200)
  const total = rows.length
  const totalPages = Math.max(Math.ceil(total / perPage), 1)
  const items = rows.slice((page - 1) * perPage, page * perPage)

  return { items, total, page, perPage, totalPages }
}
