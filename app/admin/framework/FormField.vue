<script setup lang="ts">
import { useField } from 'vee-validate'
import type { FieldOption, FieldNode } from '~/admin/core/types'
import type { Paginated } from '#shared/types/api'
import type { RowRecord } from '~/admin/tables/useResourceTable'

const props = defineProps<{ node: FieldNode }>()

const name = toRef(() => props.node.name)
const { value, errorMessage } = useField<string | number | boolean | null>(name)

/* v-model target: casts are not allowed inside the directive itself */
const stringValue = computed<string>({
  get: () => (value.value ?? '') as string,
  set: (v) => {
    value.value = v
  }
})

/* relation options are lazy-loaded from the related resource API */
const relationOptions = ref<FieldOption[]>([])

onMounted(async () => {
  const rel = props.node.relation
  if (props.node.kind !== 'relation' || !rel) return
  try {
    const res = await $fetch<Paginated<RowRecord>>(`/api/admin/${rel.resource}`, {
      query: { perPage: 200 }
    })
    relationOptions.value = res.items.map(r => ({
      label: String(r[rel.labelKey] ?? r.id),
      value: r.id as string | number
    }))
  } catch {
    relationOptions.value = []
  }
})

const options = computed<FieldOption[]>(() =>
  props.node.kind === 'relation' ? relationOptions.value : (props.node.options ?? [])
)

const inputType = computed(() => {
  switch (props.node.kind) {
    case 'email': return 'email'
    case 'password': return 'password'
    case 'number': return 'number'
    case 'date': return 'date'
    default: return 'text'
  }
})
</script>

<template>
  <div class="space-y-1.5">
    <UiLabel
      v-if="node.kind !== 'switch' && node.kind !== 'checkbox'"
      :for="node.name"
    >
      {{ node.label }}<span
        v-if="node.required"
        class="text-destructive"
      > *</span>
    </UiLabel>

    <UiInput
      v-if="['text', 'email', 'password', 'number', 'date'].includes(node.kind)"
      :id="node.name"
      v-model="stringValue"
      :type="inputType"
      :placeholder="node.placeholder"
      :disabled="node.disabled"
    />

    <UiTextarea
      v-else-if="node.kind === 'textarea'"
      :id="node.name"
      v-model="stringValue"
      :rows="node.rows ?? 4"
      :placeholder="node.placeholder"
      :disabled="node.disabled"
    />

    <template v-else-if="node.kind === 'select' || node.kind === 'relation'">
      <UiSelect
        v-if="options.length > 0 || node.kind === 'select'"
        :id="node.name"
        v-model="stringValue"
        :options="options"
        :placeholder="node.required ? `Select ${node.label.toLowerCase()}` : undefined"
        :disabled="node.disabled"
      />
      <div
        v-else
        class="flex h-9 items-center rounded-md border border-input px-3 text-sm text-muted-foreground"
      >
        Loading…
      </div>
    </template>

    <UiSwitch
      v-else-if="node.kind === 'switch'"
      :model-value="Boolean(value)"
      :disabled="node.disabled"
      @update:model-value="value = $event"
    >
      <span v-if="!node.helpText">{{ node.label }}</span>
    </UiSwitch>

    <UiCheckbox
      v-else-if="node.kind === 'checkbox'"
      :model-value="Boolean(value)"
      :disabled="node.disabled"
      :label="node.label"
      @update:model-value="value = $event"
    />

    <p
      v-if="errorMessage"
      class="text-xs text-destructive"
    >
      {{ errorMessage }}
    </p>
    <p
      v-else-if="node.helpText"
      class="text-xs text-muted-foreground"
    >
      {{ node.helpText }}
    </p>
  </div>
</template>
