import MediaResource from './admin/MediaResource'

export default defineModule(t => ({
  name: 'media',
  resources: [MediaResource(t)],
  navGroups: [{ label: t('res.media.group'), sort: 40 }]
}))
