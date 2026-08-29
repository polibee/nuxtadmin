import { getConfig } from '../../utils/resourceConfigs'
import { requirePermission, requireUser } from '../../utils/auth'
import { discardAutosave, readAutosave } from '../../utils/autosave'

/**
 * GET /api/admin/autosave?resource=&id= — read the caller's draft.
 * Pass ?discard=1 to delete it after reading.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const query = getQuery(event)

  const resource = String(query.resource ?? '')
  const id = String(query.id ?? '')
  if (!resource || !id) {
    throw createError({ statusCode: 422, statusMessage: 'resource and id are required' })
  }
  const cfg = getConfig(resource)
  await requirePermission(event, `${cfg.permissionPrefix}.edit`)

  const entry = await readAutosave(resource, id, user.id)
  if (!entry) return { draft: null }

  if (query.discard === '1') {
    await discardAutosave(resource, id, user.id)
  }
  return { draft: entry }
})
