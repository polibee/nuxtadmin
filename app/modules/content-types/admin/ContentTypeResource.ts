import type { Translator } from '~/admin/core/types'

export default (t: Translator) => defineResource({
  name: 'content-types',
  model: 'ContentType',
  label: t('res.ct.label'),
  labelPlural: t('res.ct.plural'),
  icon: 'box',
  group: t('res.ct.group'),
  sort: 92,
  permissionPrefix: 'content-types',
  searchable: ['name'],

  table: () => [
    textColumn('name', t('res.ct.field.name'), { sortable: true }),
    textColumn('slug', t('res.ct.col.slug')),
    tagsColumn('fields', t('res.ct.col.fields')),
    dateColumn('createdAt', t('res.ct.col.created'), { sortable: true }),
    actionsColumn([
      defineAction({
        name: 'reload-registry',
        label: t('res.ct.reloadRegistry'),
        icon: 'activity',
        permission: 'content-types.edit',
        handler: async () => {
          notify(t('res.ct.reloading'))
          reloadNuxtApp()
        }
      })
    ])
  ],

  form: () => [
    section(t('res.ct.section.identity'), [
      grid(2, [
        textInput('name', t('res.ct.field.name'), { required: true, placeholder: 'Product' }),
        textInput('slug', 'Slug', { placeholder: 'Auto-generated if empty', helpText: t('res.ct.slugHint') })
      ])
    ]),
    section(t('res.ct.section.fields'), [
      repeaterInput('fields', t('res.ct.addField'), [
        textInput('name', t('res.ct.field.fieldName'), { required: true, placeholder: 'title' }),
        textInput('label', t('res.ct.field.label'), { required: true, placeholder: 'Title' }),
        selectInput('type', t('res.ct.field.type'), [
          { label: t('res.ct.type.string'), value: 'string' },
          { label: t('res.ct.type.number'), value: 'number' },
          { label: t('res.ct.type.boolean'), value: 'boolean' },
          { label: t('res.ct.type.select'), value: 'select' },
          { label: t('res.ct.type.date'), value: 'date' },
          { label: t('res.ct.type.richtext'), value: 'richtext' }
        ], { defaultValue: 'string' }),
        textInput('options', t('res.ct.field.options'), { placeholder: 'foo,bar,baz' }),
        switchInput('required', t('res.ct.field.required'))
      ])
    ])
  ],

  infolist: () => [
    textEntry('name', t('res.ct.field.name')),
    textEntry('slug', t('res.ct.col.slug')),
    tagsEntry('fields', t('res.ct.col.fields')),
    datetimeEntry('createdAt', t('res.ct.col.created'))
  ]
})
