<script setup lang="ts">
const { t } = useI18n()

interface RevenuePoint { label: string, revenue: number }

const series = ref<RevenuePoint[]>([])

onMounted(async () => {
  try {
    const stats = await $fetch<{ revenueSeries: RevenuePoint[] }>('/api/admin/stats')
    series.value = stats.revenueSeries
  } catch {
    series.value = []
  }
})

const max = computed(() => Math.max(...series.value.map(p => p.revenue), 1))
</script>

<template>
  <UiCard class="flex h-full flex-col p-5">
    <div class="mb-4 flex items-baseline justify-between">
      <div>
        <h3 class="text-sm font-semibold">
          {{ t('widget.weeklyRevenue') }}
        </h3>
        <p class="text-xs text-muted-foreground">
          {{ t('widget.weeklyHint') }}
        </p>
      </div>
    </div>

    <div
      v-if="series.length"
      class="flex h-40 items-end gap-1.5"
    >
      <div
        v-for="point in series"
        :key="point.label"
        class="group relative flex h-full flex-1 items-end"
      >
        <div
          class="w-full rounded-t-md bg-primary/70 transition-colors group-hover:bg-primary"
          :style="{ height: `${Math.max((point.revenue / max) * 100, 2)}%` }"
          :title="`${point.label}: $${point.revenue.toLocaleString('en-US')}`"
        />
      </div>
    </div>
    <div
      v-else
      class="h-40 animate-pulse rounded-md bg-muted/30"
    />

    <div
      v-if="series.length"
      class="mt-2 flex justify-between text-[10px] text-muted-foreground"
    >
      <span>{{ series[0]?.label }}</span>
      <span>{{ series[series.length - 1]?.label }}</span>
    </div>
  </UiCard>
</template>
