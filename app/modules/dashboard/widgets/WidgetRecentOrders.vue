<script setup lang="ts">
interface RecentOrder {
  id: number
  orderNo: string
  customerName: string
  amount: number
  status: string
  createdAt: string
}

const statusVariants: Record<string, 'success' | 'warning' | 'default' | 'secondary' | 'destructive'> = {
  pending: 'warning',
  paid: 'default',
  shipped: 'secondary',
  completed: 'success',
  refunded: 'destructive'
}

const orders = ref<RecentOrder[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const stats = await $fetch<{ recentOrders: RecentOrder[] }>('/api/admin/stats')
    orders.value = stats.recentOrders
  } finally {
    loading.value = false
  }
})

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
</script>

<template>
  <UiCard class="flex h-full flex-col p-5">
    <div class="mb-3 flex items-baseline justify-between">
      <h3 class="text-sm font-semibold">
        Recent Orders
      </h3>
      <NuxtLink
        to="/admin/orders"
        class="text-xs text-muted-foreground hover:text-foreground"
      >View all →</NuxtLink>
    </div>

    <div
      v-if="loading"
      class="space-y-2 py-4"
    >
      <div
        v-for="i in 4"
        :key="i"
        class="h-9 animate-pulse rounded-md bg-muted/30"
      />
    </div>

    <table
      v-else
      class="w-full text-sm"
    >
      <tbody>
        <tr
          v-for="order in orders"
          :key="order.id"
          class="border-b last:border-0"
        >
          <td class="py-2.5 pr-3">
            <p class="font-medium">
              {{ order.orderNo }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ order.customerName }}
            </p>
          </td>
          <td class="py-2.5 text-right tabular-nums">
            {{ fmt.format(order.amount) }}
          </td>
          <td class="py-2.5 pl-3 text-right">
            <UiBadge :variant="statusVariants[order.status] ?? 'secondary'">
              {{ order.status }}
            </UiBadge>
          </td>
        </tr>
      </tbody>
    </table>
  </UiCard>
</template>
