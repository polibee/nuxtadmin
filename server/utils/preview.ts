/* =============================================================
 * Draft preview tokens: short-lived, in-memory, single purpose.
 * Swap with signed JWTs + database for production.
 * ============================================================= */

import { getKV } from './kv'

const TTL = 15 * 60_000

export async function createPreviewToken(resource: string, id: number): Promise<{ token: string, expiresInMin: number }> {
  const token = crypto.randomUUID()
  await getKV().set('preview:' + token, { resource, id }, TTL / 1000)
  return { token, expiresInMin: TTL / 60_000 }
}

export async function readPreviewToken(token: string | undefined): Promise<{ resource: string, id: number } | undefined> {
  if (!token) return undefined
  return (await getKV().get('preview:' + token)) as { resource: string, id: number } | undefined
}

/** preview is allowed for draft-able collections only */
export function isPreviewableResource(resource: string): boolean {
  return resource === 'posts' || resource.startsWith('ct_')
}
