<script setup lang="ts">
import type { ResolvedResource } from '~/admin/core/types'
import { ArrowLeftIcon } from 'lucide-vue-next'

const props = defineProps<{
  resource: ResolvedResource
  mode: 'create' | 'edit'
  id?: string
}>()

const panel = getPanel()
const { t } = useI18n()
const basePath = computed(() => `${panel.path}/${props.resource.name}`)
const schema = computed(() => props.resource.form?.() ?? [])

/** multipart when the schema contains file fields, JSON otherwise */
function buildBody(values: Record<string, unknown>): FormData | Record<string, unknown> {
  if (!Object.values(values).some(v => v instanceof File)) return values
  const fd = new FormData()
  for (const [key, val] of Object.entries(values)) {
    if (val === undefined || val === null) continue
    fd.append(key, val instanceof File ? val : JSON.stringify(val))
  }
  return fd
}

const { form, submit, submitting } = useFormSchema({
  schema: () => schema.value,
  initialValues: {},
  onSubmit: async (values) => {
    if (props.mode === 'create') {
      const url = props.resource.endpoints?.create ?? `/api/admin/${props.resource.name}`
      await $fetch(url, { method: 'POST', body: buildBody(values) })
      notify(t('toast.created', { label: props.resource.label }))
    } else {
      await $fetch(`/api/admin/${props.resource.name}/${props.id}`, {
        method: 'PUT',
        body: buildBody(values)
      })
      notify(t('toast.updated', { label: props.resource.label }))
    }
    await discardDraft()
    await navigateTo(basePath.value)
  }
})

/* edit mode: hydrate the form once the record arrives */
const loading = ref(props.mode === 'edit')

/* ---------------- autosave (edit mode only) ---------------- */

interface DraftEntry {
  values: Record<string, unknown>
  savedAt: string
}

const draft = ref<DraftEntry | null>(null)
const autosaveAt = ref('')
const allow = useCan()
const canAutosave = computed(() =>
  props.mode === 'edit' && allow(`${props.resource.permissionPrefix}.edit`)
)

let autosaveTimer: ReturnType<typeof setTimeout> | null = null
let suppressAutosave = true

async function discardDraft(): Promise<void> {
  draft.value = null
  await $fetch('/api/admin/autosave', {
    query: { resource: props.resource.name, id: props.id, discard: 1 }
  }).catch(() => undefined)
}

onMounted(async () => {
  if (props.mode !== 'edit' || !props.id) return
  try {
    const record = await $fetch<Record<string, unknown>>(`/api/admin/${props.resource.name}/${props.id}`)
    form.setValues(record as never)
  } catch (e: unknown) {
    notifyError(t('toast.loadFailed', { label: props.resource.label }), (e as Error).message)
  }

  try {
    const res = await $fetch<{ draft: DraftEntry | null }>('/api/admin/autosave', {
      query: { resource: props.resource.name, id: props.id }
    })
    draft.value = res.draft
  } catch {
    draft.value = null
  }

  suppressAutosave = false
  loading.value = false
})

watch(() => ({ ...form.values }), (values) => {
  if (!canAutosave.value || suppressAutosave || submitting.value) return
  if (autosaveTimer) clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(async () => {
    try {
      const res = await $fetch<{ savedAt: string }>('/api/admin/autosave', {
        method: 'POST',
        body: { resource: props.resource.name, id: props.id, values }
      })
      autosaveAt.value = res.savedAt
    } catch {
      autosaveAt.value = ''
    }
  }, 1500)
}, { deep: true })

function restoreDraft(): void {
  if (!draft.value) return
  suppressAutosave = true
  form.setValues(draft.value.values as never)
  draft.value = null
  nextTick(() => {
    suppressAutosave = false
  })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ mode === 'create' ? t('common.newLabel', { label: resource.label }) : t('common.editLabel', { label: resource.label }) }}
        </h1>
        <NuxtLink
          :to="basePath"
          class="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {{ t('common.backTo', { target: resource.labelPlural.toLowerCase() }) }}
        </NuxtLink>
      </div>
    </div>

    <UiAlert
      v-if="draft"
      variant="info"
      class="flex flex-wrap items-center justify-between gap-3"
    >
      <div>
        <p class="font-medium">
          Unsaved draft found
        </p>
        <p class="mt-0.5 text-xs text-muted-foreground">
          Autosaved {{ new Date(draft.savedAt).toLocaleString() }}
        </p>
      </div>
      <div class="flex gap-2">
        <UiButton
          size="sm"
          variant="outline"
          @click="draft = null; discardDraft()"
        >
          Discard
        </UiButton>
        <UiButton
          size="sm"
          @click="restoreDraft"
        >
          Restore draft
        </UiButton>
      </div>
    </UiAlert>

    <UiCard class="p-6">
      <div
        v-if="loading"
        class="py-12 text-center text-muted-foreground"
      >
        {{ t('common.loading') }}
      </div>
      <form
        v-else
        class="space-y-8"
        @submit.prevent="submit"
      >
        <FormSchemaRenderer :schema="schema" />
        <div class="flex items-center justify-end gap-2 border-t pt-6">
          <span
            v-if="autosaveAt && mode === 'edit'"
            class="mr-auto text-xs text-muted-foreground"
          >
            Draft saved {{ new Date(autosaveAt).toLocaleTimeString() }}
          </span>
          <UiButton
            type="button"
            variant="outline"
            :disabled="submitting"
            @click="navigateTo(basePath)"
          >
            <ArrowLeftIcon /> {{ t('common.cancel') }}
          </UiButton>
          <UiButton
            type="submit"
            :disabled="submitting"
          >
            {{ submitting ? t('common.saving') : mode === 'create' ? t('common.createLabel', { label: resource.label }) : t('common.saveChanges') }}
          </UiButton>
        </div>
      </form>
    </UiCard>
  </div>
</template>
