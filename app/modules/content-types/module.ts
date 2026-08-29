import ContentTypeResource from './admin/ContentTypeResource'

export default defineModule(t => ({
  name: 'content-types',
  resources: [ContentTypeResource(t)],
  navGroups: [{ label: t('res.ct.group'), sort: 92 }]
}))
