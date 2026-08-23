import { findRow } from '../../../utils/db'
import { getConfig } from '../../../utils/resourceConfigs'
import { requirePermission } from '../../../utils/auth'

export default defineEventHandler((event) => {
  const resource = getRouterParam(event, 'resource')!
  const cfg = getConfig(resource)
  requirePermission(event, `${cfg.permissionPrefix}.view`)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }
  return findRow(resource, id)
})
