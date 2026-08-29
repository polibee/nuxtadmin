import RoleResource from './admin/RoleResource'

export default defineModule(t => ({
  name: 'roles',
  resources: [RoleResource(t)],
  navGroups: [{ label: t('res.roles.group'), sort: 91 }]
}))
