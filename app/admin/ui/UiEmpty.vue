<script setup lang="ts">
import { cn } from '~/admin/utils/cn'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <div :class="cn('flex min-h-52 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center', props.class)">
    <slot name="icon" />
    <p class="text-sm font-medium">
      <slot name="title" />
    </p>
    <p
      v-if="$slots.description"
      class="max-w-sm text-xs text-muted-foreground"
    >
      <slot name="description" />
    </p>
    <div
      v-if="$slots.default"
      class="mt-2"
    >
      <slot />
    </div>
  </div>
</template>
