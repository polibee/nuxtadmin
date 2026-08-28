import type { ColumnDefLite, EntryNode, ModuleDef, SchemaNode } from '~/admin/core/types'

interface ContentTypeField {
  name: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'date'
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
    default: return textInput(f.name, f.label, opts)
  }
}

function entryFor(f: ContentTypeField): EntryNode {
  switch (f.type) {
    case 'boolean': return booleanEntry(f.name, f.label)
    case 'date': return dateEntry(f.name, f.label)
    default: return textEntry(f.name, f.label)
  }
}

/**
 * Turns a stored content type definition into a registrable module.
 * Used both by the content-types module (preview of itself is not
 * registered) and the boot plugin for every stored type.
 */
export function buildContentModule(ct: ContentTypeLike): ModuleDef {
  const resource = defineResource({
    name: `ct_${ct.slug}`,
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
      dateColumn('createdAt', 'Created', { sortable: true })
    ],
    form: () => ct.fields.map(fieldFor),
    infolist: () => ct.fields.map(entryFor)
  })

  return defineModule({
    name: `content-${ct.slug}`,
    resources: [resource]
  })
}
