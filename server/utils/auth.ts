/* resolve the event type from h3 helpers themselves - immune to
   duplicate h3 copies across @nuxt/nitro-server and standalone h3 */
import type { AuthUser } from '#shared/types/api'
import { findRoleByKey } from './db'
import { getKV } from './kv'

type H3Evt = Parameters<typeof getCookie>[0]

/* =============================================================
 * Demo auth: accounts reference seeded roles; permissions are
 * resolved from the roles collection (editable in the RBAC UI).
 * Replace with real identity provider / JWT in production.
 * ============================================================= */

interface Account {
  id: number
  name: string
  email: string
  password: string
}

const ACCOUNTS: Account[] = [
  { id: 1, name: 'Ada Admin', email: 'admin@demo.dev', password: 'password' },
  { id: 2, name: 'Eli Editor', email: 'editor@demo.dev', password: 'password' },
  { id: 3, name: 'Vera Viewer', email: 'viewer@demo.dev', password: 'password' }
]

const SESSION_COOKIE = 'admin_session'
const SESSION_TTL = 60 * 60 * 8

export async function createSession(email: string, password: string): Promise<{ token: string, user: AuthUser } | undefined> {
  const account = ACCOUNTS.find(a => a.email === email && a.password === password)
  if (!account) return undefined

  // map account index to the seeded role with the same key
  const roleKey = account.email.startsWith('admin') ? 'admin' : account.email.startsWith('editor') ? 'editor' : 'viewer'
  const role = findRoleByKey(roleKey)

  const user: AuthUser = {
    id: account.id,
    name: account.name,
    email: account.email,
    role: role?.key === 'admin' ? 'admin' : role?.key === 'editor' ? 'editor' : 'viewer',
    permissions: role?.permissions ?? []
  }
  const token = crypto.randomUUID()
  await getKV().set('sess:' + token, user, SESSION_TTL)
  return { token, user }
}

export async function destroySession(token: string): Promise<void> {
  await getKV().del('sess:' + token)
}

export async function getSessionUser(event: H3Evt): Promise<AuthUser | undefined> {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return undefined
  return (await getKV().get('sess:' + token)) as AuthUser | undefined
}

export async function requireUser(event: H3Evt): Promise<AuthUser> {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}

/** server-side permission enforcement (defense in depth) */
export async function requirePermission(event: H3Evt, permission: string): Promise<AuthUser> {
  const user = await requireUser(event)
  if (user.permissions.includes('*')) return user
  if (user.permissions.includes(permission)) return user
  if (user.permissions.some(p => p.endsWith('.*') && permission.startsWith(p.slice(0, -1)))) return user
  throw createError({ statusCode: 403, statusMessage: `Missing permission: ${permission}` })
}

export function setSessionCookie(event: H3Evt, token: string): void {
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8
  })
}

export function clearSessionCookie(event: H3Evt): void {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}
