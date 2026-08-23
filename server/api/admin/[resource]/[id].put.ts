import { updateRow } from '../../../utils/db'
import { getConfig, validateInput } from '../../../utils/resourceConfigs'
import { requirePermission } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const resource = getRouterParam(event, 'resource')!
  const cfg = getConfig(resource)
  requirePermission(event, `${cfg.permissionPrefix}.edit`)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const body = await readBody<Record<string, unknown>>(event)
  const result = validateInput(resource, body ?? {}, 'update')
  if (!result.ok) {
    throw createError({ statusCode: 422, statusMessage: result.message })
  }
  if (Object.keys(result.data).length === 0) {
    throw createError({ statusCode: 422, statusMessage: 'No valid fields to update' })
  }

  return updateRow(resource, id, result.data)
})
