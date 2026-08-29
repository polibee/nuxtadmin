import type { ColumnDefLite, EntryNode, ModuleDef, SchemaNode, Translator } from '~/admin/core/types'

interface ContentTypeField {
  name: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'date' | 'richtext'
  required?: boolean
  options?: string
}

export interface ContentTypeLike {
  name: string
  slug: string
  fields: ContentTypeField[]
}

function columnFor(f: ContentTypeField): ColumnDefLite {
  switch (f.type) {
    case 'number': return numberColumn(f.name, f.label, { sortable: true })
    case 'boolean': return booleanColumn(f.name, f.label)
    case 'date': return dateColumn(f.name, f.label)
    default: return textColumn(f.name, f.label)
  }
}

function fieldFor(f: ContentTypeField): SchemaNode {
  const opts = { required: f.required }
  switch (f.type) {
    case 'number': return numberInput(f.name, f.label, opts)
    case 'boolean': return switchInput(f.name, f.label)
    case 'date': return dateInput(f.name, f.label, opts)
    case 'select':
      return selectInput(f.name, f.label,
        (f.options ?? '').split(',').map(s => s.trim()).filter(Boolean).map(v => ({ label: v, value: v })),
        { required: f.required })
    case 'richtext': return richTextInput(f.name, f.label, opts)
    default: return textInput(f.name, f.label, opts)
  }
}

function entryFor(f: ContentTypeField): EntryNode {
  switch (f.type) {
    case 'boolean': return booleanEntry(f.name, f.label)
    case 'date': return dateEntry(f.name, f.label)
    case 'richtext': return textEntry(f.name, f.label)
    default: return textEntry(f.name, f.label)
  }
}

const STATUS_BADGES = {
  draft: { label: 'Draft', variant: 'warning' },
  review: { label: 'Review', variant: 'secondary' },
  scheduled: { label: 'Scheduled', variant: 'default' },
  published: { label: 'Published', variant: 'success' },
  archived: { label: 'Archived', variant: 'secondary' }
} as const

function lifecycleActions(name: string, t: Translator): ColumnDefLite {
  return actionsColumn([
    defineAction({
      name: 'publish',
      label: t('status.published'),
      icon: 'badge-check',
      permission: 'content.edit',
      visible: record => record.status !== 'published',
      handler: async ({ record }) => {
        await $fetch(`/api/admin/${name}/${record!.id}`, {
          method: 'PUT',
          body: { status: 'published', publishedAt: new Date().toISOString() }
        })
        notify(t('notify.published'))
        emitAdminEvent(`${name}:refresh`)
      }
    }),
    defineAction({
      name: 'preview',
      label: t('common.preview'),
      icon: 'eye',
      permission: 'content.edit',
      visible: record => record.status !== 'published',
      handler: async ({ record }) => {
        const res = await $fetch<{ url: string }>('/api/admin/preview', {
          method: 'POST',
          body: { resource: name, id: record!.id }
        })
        if (import.meta.client) window.open(res.url, '_blank', 'noopener')
      }
    }),
    defineAction({
      name: 'schedule',
      label: t('status.scheduled'),
      icon: 'clock',
      permission: 'content.edit',
      visible: record => record.status !== 'published' && record.status !== 'scheduled',
      form: () => [
        section(t('status.scheduled'), [
          dateInput('scheduledAt', t('status.published'), { required: true })
        ])
      ],
      handler: async ({ record, values }) => {
        await $fetch(`/api/admin/${name}/${record!.id}`, {
          method: 'PUT',
          body: { status: 'scheduled', scheduledAt: values!.scheduledAt }
        })
        notify(t('notify.scheduledFor', { time: String(values!.scheduledAt) }))
        emitAdminEvent(`${name}:refresh`)
      }
    }),
    defineAction({
      name: 'unpublish',
      label: t('status.draft'),
      icon: 'eye',
      permission: 'content.edit',
      visible: record => record.status === 'published',
      confirm: { title: t('notify.movedToDraft'), confirmLabel: t('common.confirm') },
      handler: async ({ record }) => {
        await $fetch(`/api/admin/${name}/${record!.id}`, {
          method: 'PUT',
          body: { status: 'draft' }
        })
        notify(t('notify.movedToDraft'))
        emitAdminEvent(`${name}:refresh`)
      }
    })
  ])
}

/**
 * Turns a stored content type definition into a registrable module.
 * Used both by the content-types module (preview of itself is not
 * registered) and the boot plugin for every stored type.
 */
export function buildContentModule(ct: ContentTypeLike): ModuleDef {
  const { t } = useI18n()
  const name = `ct_${ct.slug}`
  const resource = defineResource({
    name,
    model: ct.name,
    label: ct.name,
    labelPlural: ct.name,
    icon: 'clipboard',
    group: 'Content',
    sort: 50,
    permissionPrefix: 'content',
    searchable: ct.fields.filter(f => f.type === 'string').map(f => f.name),

    table: () => [
      textColumn('id', 'ID', { sortable: true }),
      ...ct.fields.map(columnFor),
      badgeColumn('status', t('res.posts.field.status'), STATUS_BADGES),
      dateColumn('scheduledAt', t('status.scheduled')),
      dateColumn('publishedAt', t('status.published')),
      dateColumn('createdAt', t('res.ct.col.created'), { sortable: true }),
      lifecycleActions(name, t)
    ],
    form: () => [
      ...ct.fields.map(fieldFor),
      section('SEO', [
        grid(2, [
          textInput('seoTitle', 'SEO Title', { placeholder: 'Overrides the title for search engines' }),
          textInput('canonical', 'Canonical URL', { placeholder: 'https://…' })
        ]),
        textarea('seoDescription', 'SEO Description', { rows: 2, placeholder: 'Used for meta description, RSS and previews' }),
        selectInput('robots', 'Robots', [
          { label: 'Index (default)', value: 'index' },
          { label: 'Noindex', value: 'noindex' }
        ], { defaultValue: 'index' })
      ])
    ],
    infolist: () => [
      ...ct.fields.map(entryFor),
      badgeEntry('status', 'Status', STATUS_BADGES),
      datetimeEntry('scheduledAt', 'Scheduled'),
      datetimeEntry('publishedAt', 'Published')
    ]
  })

  return defineModule({
    name: `content-${ct.slug}`,
    resources: [resource]
  })
}
