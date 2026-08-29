<script setup lang="ts">
import { RefreshCwIcon, Trash2Icon, ZapIcon } from 'lucide-vue-next'

interface CacheStats {
  enabled: boolean
  driver: string
  hits: number
  misses: number
  hitRate: number
  savedMs: number
  invalidations: number
  entries: number
  keys: Array<{ key: string, hits: number, misses: number }>
}

const { t } = useI18n()
const stats = ref<CacheStats | null>(null)
const refreshing = ref(false)

async function load(): Promise<void> {
  refreshing.value = true
  try {
    stats.value = await $fetch<CacheStats>('/api/admin/cache/stats')
  } catch {
    stats.value = null
  } finally {
    refreshing.value = false
  }
}

onMounted(load)
const timer = setInterval(load, 10_000)
onUnmounted(() => clearInterval(timer))

async function clearCache(): Promise<void> {
  await $fetch('/api/admin/cache/clear', { method: 'POST' })
  notify(t('cache.cleared'))
  await load()
}

const donut = computed(() => {
  const rate = stats.value?.hitRate ?? 0
  const circumference = 2 * Math.PI * 34
  return {
    dash: `${(rate / 100) * circumference} ${circumference}`,
    color: rate >= 80 ? 'var(--success)' : rate >= 50 ? 'var(--warning)' : 'var(--destructive)'
  }
})

const maxKeyHits = computed(() =>
  Math.max(1, ...(stats.value?.keys ?? []).map(k => k.hits + k.misses))
)
</script>

<template>
  <UiCard class="flex h-full flex-col p-5">
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <ZapIcon class="h-4 w-4 text-primary" />
        <h3 class="text-sm font-semibold">
          {{ t('cache.title') }}
        </h3>
        <UiBadge :variant="stats?.enabled ? 'success' : 'secondary'">
          {{ stats?.enabled ? t('cache.enabled') : t('cache.disabled') }}
        </UiBadge>
      </div>
      <div class="flex items-center gap-1">
        <UiButton
          variant="ghost"
          size="icon"
          class="h-7 w-7"
          :disabled="refreshing"
          @click="load"
        >
          <RefreshCwIcon class="h-3.5 w-3.5" />
        </UiButton>
        <UiButton
          v-if="stats && stats.entries > 0"
          variant="ghost"
          size="icon"
          class="h-7 w-7 text-muted-foreground hover:text-destructive"
          :title="t('cache.clear')"
          @click="clearCache"
        >
          <Trash2Icon class="h-3.5 w-3.5" />
        </UiButton>
      </div>
    </div>

    <div
      v-if="stats"
      class="space-y-4"
    >
      <!-- hit rate donut -->
      <div class="flex items-center gap-4">
        <div class="relative h-20 w-20 shrink-0">
          <svg
            viewBox="0 0 80 80"
            class="h-20 w-20 -rotate-90"
          >
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="currentColor"
              class="text-muted"
              stroke-width="8"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              :stroke="donut.color"
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="donut.dash"
            />
          </svg>
          <span class="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums">
            {{ stats.hitRate }}%
          </span>
        </div>
        <div class="grid flex-1 grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div class="flex justify-between">
            <span class="text-muted-foreground">{{ t('cache.hits') }}</span><span class="font-medium tabular-nums">{{ stats.hits }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">{{ t('cache.misses') }}</span><span class="font-medium tabular-nums">{{ stats.misses }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">{{ t('cache.saved') }}</span><span class="font-medium tabular-nums">{{ Math.round(stats.savedMs) }}ms</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">{{ t('cache.entries') }}</span><span class="font-medium tabular-nums">{{ stats.entries }}</span>
          </div>
        </div>
      </div>

      <!-- per-key bars -->
      <div
        v-if="stats.keys.length"
        class="space-y-1.5"
      >
        <div
          v-for="k in stats.keys"
          :key="k.key"
          class="space-y-0.5"
        >
          <div class="flex justify-between text-[11px]">
            <code class="text-muted-foreground">{{ k.key }}</code>
            <span class="tabular-nums text-muted-foreground">{{ k.hits }}/{{ k.hits + k.misses }}</span>
          </div>
          <div class="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              class="h-full rounded-full bg-primary/70"
              :style="{ width: `${((k.hits + k.misses) / maxKeyHits) * 100}%` }"
            />
          </div>
        </div>
      </div>
      <p
        v-else
        class="py-2 text-center text-xs text-muted-foreground"
      >
        {{ t('cache.noKeys') }}
      </p>

      <p class="text-[10px] text-muted-foreground">
        {{ t('cache.driver') }}: {{ stats.driver }} · {{ t('cache.pollHint') }}
      </p>
    </div>
  </UiCard>
</template>
