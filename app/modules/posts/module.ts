import PostResource from './admin/PostResource'

export default defineModule({
  name: 'posts',
  resources: [PostResource],
  navGroups: [{ label: 'Content', sort: 20 }]
})
