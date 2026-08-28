<script setup lang="ts">
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle
} from 'reka-ui'
import { XIcon } from 'lucide-vue-next'
import { cn } from '~/admin/utils/cn'

const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  side?: 'left' | 'right'
  class?: string
}>(), { side: 'right' })

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const sideClass = computed(() =>
  props.side === 'right'
    ? 'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-md'
    : 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-md'
)
</script>

<template>
  <DialogRoot
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/60" />
      <DialogContent
        :class="cn('fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out focus:outline-none', sideClass, props.class)"
      >
        <div class="mb-4 flex items-center justify-between">
          <DialogTitle class="text-base font-semibold">
            {{ title }}
          </DialogTitle>
          <button
            class="rounded-md text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close"
            @click="emit('update:open', false)"
          >
            <XIcon class="h-4 w-4" />
          </button>
        </div>
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
