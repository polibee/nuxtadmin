import OrderResource from './admin/OrderResource'

export default defineModule({
  name: 'orders',
  resources: [OrderResource],
  navGroups: [{ label: 'Sales', sort: 30 }]
})
