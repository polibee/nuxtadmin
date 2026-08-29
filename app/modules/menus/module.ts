import MenuResource from './admin/MenuResource'

export default defineModule({
  name: 'menus',
  resources: [MenuResource],
  navGroups: [{ label: 'Content Structure', sort: 40 }]
})
