<script setup lang="ts">
import { cn } from '~/admin/utils/cn'

const props = defineProps<{
  title?: string
  description?: string
  variant?: 'default' | 'info' | 'warning' | 'destructive'
  class?: string
}>()

const variantClass = {
  default: 'bg-card',
  info: 'bg-primary/5 border-primary/20',
  warning: 'bg-[var(--warning)]/10 border-[var(--warning)]/30',
  destructive: 'bg-destructive/5 border-destructive/30'
} as const
</script>

<template>
  <div :class="cn('rounded-lg border px-4 py-3 text-sm', variantClass[props.variant ?? 'default'], props.class)">
    <p
      v-if="title"
      class="font-medium"
    >
      {{ title }}
    </p>
    <p
      v-if="description"
      class="mt-1 text-xs text-muted-foreground"
    >
      {{ description }}
    </p>
    <slot />
  </div>
</template>
