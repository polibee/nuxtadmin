import { findRow } from '../../utils/db'
import { getConfig } from '../../utils/resourceConfigs'
import { requirePermission } from '../../utils/auth'
import { createPreviewToken, isPreviewableResource } from '../../utils/preview'

/**
 * POST /api/admin/preview — mint a short-lived preview URL for a
 * draft-able record. Returns { url, expiresInMin }.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ resource?: string, id?: number | string }>(event)
  const resource = String(body?.resource ?? '')
  const id = Number(body?.id)

  if (!isPreviewableResource(resource)) {
    throw createError({ statusCode: 400, statusMessage: 'Resource is not previewable' })
  }
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const cfg = getConfig(resource)
  requirePermission(event, `${cfg.permissionPrefix}.edit`)
  findRow(resource, id) // 404 when missing

  const { token, expiresInMin } = createPreviewToken(resource, id)
  return {
    url: `/preview/${resource}/${id}?t=${token}`,
    expiresInMin
  }
})
