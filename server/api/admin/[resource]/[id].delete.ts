import { deleteResource } from '../../../utils/crud'

export default defineEventHandler(event =>
  deleteResource(event, getRouterParam(event, 'resource')!, Number(getRouterParam(event, 'id')))
)
