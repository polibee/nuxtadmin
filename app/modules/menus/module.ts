import MenuResource from './admin/MenuResource'

export default defineModule(t => ({
  name: 'menus',
  resources: [MenuResource(t)],
  navGroups: [{ label: t('res.menus.group'), sort: 46 }]
}))
