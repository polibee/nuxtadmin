import { applyQuery } from '../../../utils/db'
import { getConfig } from '../../../utils/resourceConfigs'
import { requirePermission } from '../../../utils/auth'

export default defineEventHandler((event) => {
  const resource = getRouterParam(event, 'resource')!
  const cfg = getConfig(resource)
  requirePermission(event, `${cfg.permissionPrefix}.view`)

  const query = getQuery(event) as {
    q?: string
    page?: number
    perPage?: number
    sortBy?: string
    sortDir?: string
  }

  return applyQuery(resource, query, { searchable: cfg.searchable })
})
