import { updateResource } from '../../../utils/crud'

export default defineEventHandler(async event =>
  updateResource(
    event,
    getRouterParam(event, 'resource')!,
    Number(getRouterParam(event, 'id')),
    await readBody<Record<string, unknown>>(event)
  )
)
