import { readResource } from '../../../utils/crud'

export default defineEventHandler(event =>
  readResource(event, getRouterParam(event, 'resource')!, Number(getRouterParam(event, 'id')))
)
