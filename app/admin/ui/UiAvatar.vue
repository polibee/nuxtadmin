<script setup lang="ts">
import { AvatarRoot } from 'reka-ui'
import { cn } from '~/admin/utils/cn'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <AvatarRoot :class="cn('relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted', props.class)">
    <slot />
  </AvatarRoot>
</template>
