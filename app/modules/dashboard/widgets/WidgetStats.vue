<script setup lang="ts">
import { CreditCardIcon, FileTextIcon, ShoppingCartIcon, UsersIcon } from 'lucide-vue-next'
import { useI18n } from '~/admin/i18n'

const { t } = useI18n()

interface Stats {
  usersTotal: number
  usersActive: number
  postsTotal: number
  postsPublished: number
  ordersTotal: number
  totalRevenue: number
}

const stats = ref<Stats | null>(null)

onMounted(async () => {
  try {
    stats.value = await $fetch<Stats>('/api/admin/stats')
  } catch {
    stats.value = null
  }
})

const cards = computed(() => [
  { label: t('widget.totalUsers'), value: stats.value?.usersTotal, sub: t('widget.active', { n: stats.value?.usersActive ?? 0 }), icon: UsersIcon },
  { label: t('widget.posts'), value: stats.value?.postsTotal, sub: t('widget.published', { n: stats.value?.postsPublished ?? 0 }), icon: FileTextIcon },
  { label: t('widget.orders'), value: stats.value?.ordersTotal, icon: ShoppingCartIcon },
  { label: t('widget.revenue'), value: stats.value ? `$${stats.value.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : undefined, icon: CreditCardIcon }
])
</script>

<template>
  <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
    <UiCard
      v-for="card in cards"
      :key="card.label"
      class="p-5"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-muted-foreground">{{ card.label }}</span>
        <component
          :is="card.icon"
          class="h-4 w-4 text-muted-foreground"
        />
      </div>
      <p class="mt-2 text-2xl font-semibold tabular-nums">
        {{ card.value ?? '—' }}
      </p>
      <p
        v-if="card.sub"
        class="mt-1 text-xs text-muted-foreground"
      >
        {{ card.sub }}
      </p>
    </UiCard>
  </div>
</template>
