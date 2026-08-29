import SettingResource from './admin/SettingResource'

export default defineModule(t => ({
  name: 'settings',
  resources: [SettingResource(t)],
  navGroups: [{ label: t('res.ct.group'), sort: 97 }]
}))
