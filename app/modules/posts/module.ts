import PostResource from './admin/PostResource'

export default defineModule(t => ({
  name: 'posts',
  resources: [PostResource(t)],
  navGroups: [{ label: t('res.posts.group'), sort: 20 }]
}))
