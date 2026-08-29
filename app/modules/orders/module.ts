import OrderResource from './admin/OrderResource'

export default defineModule(t => ({
  name: 'orders',
  resources: [OrderResource(t)],
  navGroups: [{ label: t('res.orders.group'), sort: 30 }]
}))
