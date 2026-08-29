import type { Translator } from '~/admin/core/types'

export default (t: Translator) => defineResource({
  name: 'taxonomy',
  model: 'Term',
  label: t('res.taxonomy.label'),
  labelPlural: t('res.taxonomy.plural'),
  icon: 'tag',
  group: t('res.taxonomy.group'),
  sort: 45,
  permissionPrefix: 'taxonomy',
  searchable: ['name', 'slug'],

  table: () => [
    treeColumn('name', t('res.taxonomy.field.name')),
    badgeColumn('key', t('res.taxonomy.field.type'), {
      category: { label: t('res.taxonomy.category'), variant: 'default' },
      tag: { label: t('res.taxonomy.tag'), variant: 'secondary' }
    }),
    textColumn('slug', t('res.taxonomy.field.slug')),
    numberColumn('childCount', t('res.taxonomy.col.children'))
  ],

  form: () => [
    section(t('res.taxonomy.section'), [
      grid(2, [
        textInput('name', t('res.taxonomy.field.name'), { required: true, placeholder: 'Artificial Intelligence' }),
        selectInput('key', t('res.taxonomy.field.type'), [
          { label: t('res.taxonomy.category'), value: 'category' },
          { label: t('res.taxonomy.tag'), value: 'tag' }
        ], { defaultValue: 'category' }),
        textInput('slug', t('res.taxonomy.field.slug')),
        relationInput('parentId', t('res.taxonomy.field.parent'), { resource: 'taxonomy', labelKey: 'name' }, { placeholder: t('res.taxonomy.parentPlaceholder') })
      ])
    ])
  ],

  infolist: () => [
    textEntry('name', t('res.taxonomy.field.name')),
    textEntry('path', t('res.taxonomy.field.name')),
    badgeEntry('key', t('res.taxonomy.field.type'), {
      category: { label: t('res.taxonomy.category'), variant: 'default' },
      tag: { label: t('res.taxonomy.tag'), variant: 'secondary' }
    }),
    textEntry('slug', t('res.taxonomy.field.slug')),
    textEntry('childCount', t('res.taxonomy.col.children'))
  ]
})
