<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { cn } from '~/admin/utils/cn'

defineProps<{
  tabs: Array<{ value: string, label: string }>
  modelValue: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <TabsRoot
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', String($event))"
  >
    <TabsList class="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
      <TabsTrigger
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
      >
        {{ tab.label }}
      </TabsTrigger>
    </TabsList>
    <TabsContent
      v-for="tab in tabs"
      :key="tab.value"
      :value="tab.value"
      :class="cn('mt-4 focus-visible:outline-none')"
    >
      <slot :name="tab.value" />
    </TabsContent>
  </TabsRoot>
</template>
