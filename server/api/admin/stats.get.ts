import type { OrderRow } from '../../utils/db'
import { getCollection } from '../../utils/db'
import { requireUser } from '../../utils/auth'

/** Aggregated data for dashboard widgets. */
export default defineEventHandler(async (event) => {
  await requireUser(event)

  const users = getCollection('users')
  const posts = getCollection('posts')
  const orders = getCollection('orders') as unknown as OrderRow[]

  const totalRevenue = orders
    .filter(o => o.status !== 'refunded')
    .reduce((sum, o) => sum + o.amount, 0)

  // revenue by week for the last 10 weeks
  const weeks: Array<{ label: string, revenue: number }> = []
  const now = Date.now()
  for (let w = 9; w >= 0; w--) {
    const start = now - (w + 1) * 7 * 86_400_000
    const end = now - w * 7 * 86_400_000
    const revenue = orders
      .filter((o) => {
        if (o.status === 'refunded') return false
        const t = new Date(o.createdAt).getTime()
        return t >= start && t < end
      })
      .reduce((sum, o) => sum + o.amount, 0)
    weeks.push({
      label: `W-${w}`,
      revenue: Math.round(revenue * 100) / 100
    })
  }

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const orderStatuses = ['pending', 'paid', 'shipped', 'completed', 'refunded'] as const
  const ordersByStatus = Object.fromEntries(
    orderStatuses.map(s => [s, orders.filter(o => o.status === s).length])
  )

  return {
    usersTotal: users.length,
    usersActive: users.filter(u => u.status === 'active').length,
    postsTotal: posts.length,
    postsPublished: posts.filter(p => p.status === 'published').length,
    ordersTotal: orders.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    pendingOrders: ordersByStatus.pending,
    revenueSeries: weeks,
    recentOrders,
    ordersByStatus
  }
})
