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
    await navigateTo(basePath.value)
  }
})

/* edit mode: hydrate the form once the record arrives */
const loading = ref(props.mode === 'edit')

onMounted(async () => {
  if (props.mode !== 'edit' || !props.id) return
  try {
    const record = await $fetch<Record<string, unknown>>(`/api/admin/${props.resource.name}/${props.id}`)
    form.setValues(record as never)
  } catch (e: unknown) {
    notifyError(t('toast.loadFailed', { label: props.resource.label }), (e as Error).message)
  } finally {
    loading.value = false
  }
})
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
