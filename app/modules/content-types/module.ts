import ContentTypeResource from './admin/ContentTypeResource'

export default defineModule({
  name: 'content-types',
  resources: [ContentTypeResource],
  navGroups: [{ label: 'System', sort: 90 }]
})
