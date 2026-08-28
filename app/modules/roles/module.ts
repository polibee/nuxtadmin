import RoleResource from './admin/RoleResource'

export default defineModule({
  name: 'roles',
  resources: [RoleResource],
  navGroups: [{ label: 'System', sort: 90 }]
})
