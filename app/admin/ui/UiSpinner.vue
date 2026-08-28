<script setup lang="ts">
import { cn } from '~/admin/utils/cn'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <span
    :class="cn('inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent', props.class)"
    role="status"
    aria-label="Loading"
  />
</template>
