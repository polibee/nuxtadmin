import UserResource from './admin/UserResource'

export default defineModule({
  name: 'users',
  resources: [UserResource],
  navGroups: [{ label: 'User Management', sort: 10 }]
})
