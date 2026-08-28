<script setup lang="ts">
import { Separator } from 'reka-ui'
import { cn } from '~/admin/utils/cn'

const props = withDefaults(defineProps<{
  orientation?: 'horizontal' | 'vertical'
  class?: string
}>(), { orientation: 'horizontal' })
</script>

<template>
  <Separator
    :orientation="props.orientation"
    :class="cn(
      'shrink-0 bg-border',
      props.orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      props.class
    )"
  />
</template>
