import { createResource } from '../../../utils/crud'

export default defineEventHandler(async event =>
  createResource(event, getRouterParam(event, 'resource')!, await readBody<Record<string, unknown>>(event))
)
