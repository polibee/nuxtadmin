<script setup lang="ts">
import { cn } from '~/admin/utils/cn'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <div :class="cn('h-8 w-8 rounded-full bg-primary/90 text-primary-foreground', props.class)">
    <slot />
  </div>
</template>
