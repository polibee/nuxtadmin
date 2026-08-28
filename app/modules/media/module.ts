import MediaResource from './admin/MediaResource'

export default defineModule({
  name: 'media',
  resources: [MediaResource],
  navGroups: [{ label: 'Media Library', sort: 40 }]
})
