import { listResource } from '../../../utils/crud'

export default defineEventHandler(event => listResource(event, getRouterParam(event, 'resource')!))
