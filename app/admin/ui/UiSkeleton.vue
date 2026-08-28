<script setup lang="ts">
import { cn } from '~/admin/utils/cn'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <div :class="cn('animate-pulse rounded-md bg-muted/60', props.class)" />
</template>
