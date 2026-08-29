<script setup lang="ts">
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import type { SchemaNode } from '~/admin/core/types'
import type { Paginated } from '#shared/types/api'
import SettingsGroupForm, { type SettingItem } from './SettingsGroupForm.vue'

defineProps<{ resource: { name: string } }>()

const allow = useCan()
const canEdit = computed(() => allow('settings.edit'))

const settings = ref<SettingItem[]>([])
const loading = ref(true)
const version = ref(0)

const groupOrder = ['General', 'Blog', 'Email', 'Cache', 'Security', 'Storage', 'Plugin']

const groups = computed<Array<{ label: string, items: SettingItem[] }>>(() => {
  const map = new Map<string, SettingItem[]>()
  for (const s of settings.value) {
    if (!map.has(s.group)) map.set(s.group, [])
    map.get(s.group)!.push(s)
  }
  return [...map.entries()]
    .map(([label, items]) => ({ label, items }))
    .sort((a, b) => {
      const ia = groupOrder.indexOf(a.label)
      const ib = groupOrder.indexOf(b.label)
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.label.localeCompare(b.label)
    })
})

const activeTab = ref('')

watch(groups, (g) => {
  if (!g.some(gr => gr.label === activeTab.value)) activeTab.value = g[0]?.label ?? ''
}, { immediate: true })

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await $fetch<Paginated<SettingItem>>('/api/admin/settings', { query: { perPage: 200 } })
    settings.value = res.items
  } catch (e: unknown) {
    notifyError('Failed to load settings', (e as Error).message)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(version, load)

/* ---- add-setting dialog ---- */
const addOpen = ref(false)
const addGroup = ref('General')
const { t } = useI18n()

const addSchema = computed<SchemaNode[]>(() => [
  section('New Setting', [
    grid(2, [
      textInput('key', 'Key', { required: true, placeholder: 'SITE_NAME' }),
      textInput('group', 'Group', { required: true, defaultValue: addGroup.value }),
      selectInput('type', 'Type', [
        { label: 'String', value: 'string' },
        { label: 'Text', value: 'text' },
        { label: 'Number', value: 'number' },
        { label: 'Boolean', value: 'boolean' },
        { label: 'Secret', value: 'secret' }
      ], { defaultValue: 'string' }),
      switchInput('public', 'Public', { defaultValue: false }),
      textInput('value', 'Value', { colSpan: 2 }),
      textarea('description', 'Description', { rows: 2, colSpan: 2 })
    ])
  ])
])

const { setValues: addSetValues, submit: addSubmit, submitting: addSubmitting } = useFormSchema({
  schema: () => addSchema.value,
  initialValues: { group: 'General', type: 'string', public: false },
  onSubmit: async (values) => {
    await $fetch('/api/admin/settings', { method: 'POST', body: values })
    notify(`${values.key} created`)
    addOpen.value = false
    version.value++
  }
})

function openAdd(group: string): void {
  addGroup.value = group
  addSetValues({ group, type: 'string', public: false, key: '', value: '', description: '' })
  addOpen.value = true
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">
        Settings
      </h1>
      <p class="text-sm text-muted-foreground">
        Grouped configuration · <code class="text-xs">public</code> settings are exposed at
        <code class="text-xs">/api/public-settings</code>, secrets never leave the admin.
      </p>
    </div>

    <div
      v-if="loading"
      class="space-y-3"
    >
      <UiSkeleton class="h-10 w-96" />
      <UiSkeleton class="h-32 w-full" />
      <UiSkeleton class="h-32 w-full" />
    </div>

    <template v-else-if="groups.length">
      <UiTabs
        v-model="activeTab"
        :tabs="groups.map(g => ({ value: g.label, label: `${g.label} (${g.items.length})` }))"
      />

      <SettingsGroupForm
        v-for="g in groups"
        v-show="activeTab === g.label"
        :key="`${g.label}-${version}`"
        :group="g.label"
        :settings="g.items"
        :can-edit="canEdit"
        class="mt-4"
        @change="version++"
        @add="openAdd"
      />
    </template>

    <UiEmpty v-else>
      <template #title>
        No settings defined.
      </template>
      <UiButton
        v-if="canEdit"
        size="sm"
        @click="openAdd('General')"
      >
        {{ t('common.new') }}
      </UiButton>
    </UiEmpty>

    <!-- add setting dialog -->
    <DialogRoot
      :open="addOpen"
      @update:open="v => (addOpen = v)"
    >
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/60" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-6 shadow-lg focus:outline-none">
          <DialogTitle class="text-base font-semibold">
            {{ t('common.new') }} · {{ addGroup }}
          </DialogTitle>
          <div class="mt-4">
            <form
              class="space-y-6"
              @submit.prevent="addSubmit"
            >
              <FormSchemaRenderer :schema="addSchema" />
              <div class="flex justify-end gap-2">
                <UiButton
                  type="button"
                  variant="outline"
                  :disabled="addSubmitting"
                  @click="addOpen = false"
                >
                  {{ t('common.cancel') }}
                </UiButton>
                <UiButton
                  type="submit"
                  :disabled="addSubmitting"
                >
                  {{ addSubmitting ? t('common.saving') : t('common.save') }}
                </UiButton>
              </div>
            </form>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
