import { insertRow } from '../../../utils/db'
import { getConfig, validateInput } from '../../../utils/resourceConfigs'
import { requirePermission } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const resource = getRouterParam(event, 'resource')!
  const cfg = getConfig(resource)
  requirePermission(event, `${cfg.permissionPrefix}.create`)

  const body = await readBody<Record<string, unknown>>(event)
  const result = validateInput(resource, body ?? {}, 'create')
  if (!result.ok) {
    throw createError({ statusCode: 422, statusMessage: result.message })
  }

  // server-managed defaults
  if (resource === 'orders' && !result.data.orderNo) {
    result.data.orderNo = `ORD-${Date.now().toString().slice(-6)}`
  }

  return insertRow(resource, result.data)
})
