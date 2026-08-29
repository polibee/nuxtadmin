import { getConfig } from '../../utils/resourceConfigs'
import { requirePermission, requireUser } from '../../utils/auth'
import { saveAutosave } from '../../utils/autosave'

/** POST /api/admin/autosave — store a raw form snapshot (per user+record) */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{ resource?: string, id?: string | number, values?: Record<string, unknown> }>(event)

  const resource = String(body?.resource ?? '')
  const id = String(body?.id ?? '')
  if (!resource || !id || !body?.values || typeof body.values !== 'object') {
    throw createError({ statusCode: 422, statusMessage: 'resource, id and values are required' })
  }
  const cfg = getConfig(resource)
  await requirePermission(event, `${cfg.permissionPrefix}.edit`)

  const entry = await saveAutosave(resource, id, user.id, body.values)
  return { savedAt: entry.savedAt }
})
