import WidgetStats from './widgets/WidgetStats.vue'
import WidgetRevenueChart from './widgets/WidgetRevenueChart.vue'
import WidgetRecentOrders from './widgets/WidgetRecentOrders.vue'

export default defineModule({
  name: 'dashboard',
  navGroups: [{ label: 'General', sort: 0 }],
  widgets: [
    { name: 'stats-overview', span: 4, order: 1, component: WidgetStats },
    { name: 'revenue-chart', label: 'Weekly Revenue', span: 2, order: 2, component: WidgetRevenueChart },
    { name: 'recent-orders', label: 'Recent Orders', span: 2, order: 3, component: WidgetRecentOrders }
  ]
})
