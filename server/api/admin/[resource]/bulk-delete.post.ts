import { deleteRows } from '../../../utils/db'
import { getConfig } from '../../../utils/resourceConfigs'
import { requirePermission } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const resource = getRouterParam(event, 'resource')!
  const cfg = getConfig(resource)
  requirePermission(event, `${cfg.permissionPrefix}.delete`)

  const body = await readBody<{ ids?: Array<number | string> }>(event)
  const ids = (body?.ids ?? [])
    .map(Number)
    .filter(n => Number.isInteger(n))

  if (ids.length === 0) {
    throw createError({ statusCode: 422, statusMessage: 'No ids provided' })
  }

  const removed = deleteRows(resource, ids)
  return { removed }
})
