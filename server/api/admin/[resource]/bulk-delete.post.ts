import { bulkDeleteResource } from '../../../utils/crud'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ ids?: Array<number | string> }>(event)
  const ids = (body?.ids ?? [])
    .map(Number)
    .filter(n => Number.isInteger(n))
  return bulkDeleteResource(event, getRouterParam(event, 'resource')!, ids)
})
