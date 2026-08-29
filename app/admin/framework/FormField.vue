<script setup lang="ts">
import { useField } from 'vee-validate'
import type { FieldOption, FieldNode } from '~/admin/core/types'
import type { Paginated } from '#shared/types/api'
import type { RowRecord } from '~/admin/tables/useResourceTable'

const props = defineProps<{ node: FieldNode }>()

const { t } = useI18n()
const name = toRef(() => props.node.name)
const { value, errorMessage } = useField<unknown>(name)

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

/* file picker: value is a File object, replaced on every selection */
const fileName = computed(() =>
  value.value instanceof File ? value.value.name : ''
)

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  value.value = input.files?.[0] ?? null
}

/* repeater: array of records built from node.subFields */
const repeaterRows = computed<Array<Record<string, unknown>>>(() =>
  Array.isArray(value.value) ? value.value as Array<Record<string, unknown>> : []
)

function addRow(): void {
  const rows = [...repeaterRows.value, {}]
  value.value = rows
}

function removeRow(index: number): void {
  const rows = repeaterRows.value.filter((_, i) => i !== index)
  value.value = rows
}

function subPath(index: number, subName: string): string {
  return `${props.node.name}.${index}.${subName}`
}

/* permission matrix: string[] of granted keys over registry resources */
const PERM_ACTIONS = ['view', 'create', 'edit', 'delete'] as const

const permRows = computed(() => [
  { key: '*', label: '* (all permissions)' },
  ...getResources().flatMap(r =>
    PERM_ACTIONS.map(a => ({ key: `${r.permissionPrefix}.${a}`, label: `${r.permissionPrefix}.${a}` }))
  )
])

function hasPerm(key: string): boolean {
  return Array.isArray(value.value) && (value.value as string[]).includes(key)
}

function togglePerm(key: string): void {
  const current = Array.isArray(value.value) ? [...value.value as string[]] : []
  const index = current.indexOf(key)
  if (index >= 0) current.splice(index, 1)
  else current.push(key)
  value.value = current
}
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
        {{ t('common.loading') }}
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

    <!-- tiptap rich text -->
    <RichTextEditor
      v-else-if="node.kind === 'richtext'"
      v-model="stringValue"
      :disabled="node.disabled"
    />

    <!-- file upload -->
    <template v-else-if="node.kind === 'file'">
      <label
        :for="node.name"
        class="flex h-9 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors hover:bg-accent/50"
        :class="node.disabled ? 'cursor-not-allowed opacity-50' : ''"
      >
        <span class="truncate text-muted-foreground">{{ fileName || node.placeholder || 'Choose a file…' }}</span>
        <input
          :id="node.name"
          type="file"
          class="sr-only"
          :disabled="node.disabled"
          @change="onFileChange"
        >
      </label>
    </template>

    <!-- repeater -->
    <div
      v-else-if="node.kind === 'repeater'"
      class="space-y-3"
    >
      <div
        v-for="(_, index) in repeaterRows"
        :key="index"
        class="rounded-lg border p-3"
      >
        <div class="mb-2 flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground">#{{ index + 1 }}</span>
          <UiButton
            type="button"
            variant="ghost"
            size="sm"
            class="h-7 text-destructive"
            @click="removeRow(index)"
          >
            {{ t('common.delete') }}
          </UiButton>
        </div>
        <FormSchemaRenderer
          :schema="node.subFields ? node.subFields.map(s => ({ ...s, name: subPath(index, s.name) })) : []"
          in-grid
        />
      </div>
      <UiButton
        type="button"
        variant="outline"
        size="sm"
        @click="addRow"
      >
        + {{ node.label }}
      </UiButton>
    </div>

    <!-- permission matrix -->
    <div
      v-else-if="node.kind === 'permissions'"
      class="max-h-72 space-y-1 overflow-y-auto rounded-lg border p-3"
    >
      <label
        v-for="row in permRows"
        :key="row.key"
        class="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-accent/50"
      >
        <input
          type="checkbox"
          :checked="hasPerm(row.key)"
          class="h-3.5 w-3.5 rounded border-input"
          @change="togglePerm(row.key)"
        >
        <span class="font-mono text-xs">{{ row.label }}</span>
      </label>
    </div>

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
