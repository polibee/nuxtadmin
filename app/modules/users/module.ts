import UserResource from './admin/UserResource'

export default defineModule(t => ({
  name: 'users',
  resources: [UserResource(t)],
  navGroups: [{ label: t('res.users.group'), sort: 10 }]
}))
