import type { Translator } from '~/admin/core/types'

export default (t: Translator) => defineResource({
  name: 'menus',
  model: 'Menu',
  label: t('res.menus.label'),
  labelPlural: t('res.menus.plural'),
  icon: 'menu',
  group: t('res.menus.group'),
  sort: 46,
  permissionPrefix: 'menus',
  searchable: ['name'],

  table: () => [
    textColumn('name', t('res.menus.field.name'), { sortable: true }),
    badgeColumn('location', t('res.menus.field.location'), {
      header: { label: t('res.menus.loc.header'), variant: 'default' },
      footer: { label: t('res.menus.loc.footer'), variant: 'secondary' },
      custom: { label: t('res.menus.loc.custom'), variant: 'warning' }
    }),
    numberColumn('itemCount', t('res.menus.col.items'))
  ],

  form: () => [
    section(t('res.menus.section.definition'), [
      grid(2, [
        textInput('name', t('res.menus.field.name'), { required: true, placeholder: 'Main Navigation' }),
        selectInput('location', t('res.menus.field.location'), [
          { label: t('res.menus.loc.header'), value: 'header' },
          { label: t('res.menus.loc.footer'), value: 'footer' },
          { label: t('res.menus.loc.custom'), value: 'custom' }
        ], { defaultValue: 'header' })
      ])
    ]),
    section(t('res.menus.field.items'), [
      repeaterInput('items', t('res.menus.addItem'), [
        textInput('label', t('res.menus.field.label'), { required: true, placeholder: 'Blog' }),
        textInput('url', t('res.menus.field.url'), { required: true, placeholder: '/blog' }),
        repeaterInput('children', t('res.menus.addChild'), [
          textInput('label', t('res.menus.field.label'), { required: true }),
          textInput('url', t('res.menus.field.url'), { required: true })
        ])
      ])
    ])
  ],

  infolist: () => [
    textEntry('name', t('res.menus.field.name')),
    badgeEntry('location', t('res.menus.field.location'), {
      header: { label: t('res.menus.loc.header'), variant: 'default' },
      footer: { label: t('res.menus.loc.footer'), variant: 'secondary' },
      custom: { label: t('res.menus.loc.custom'), variant: 'warning' }
    }),
    textEntry('itemCount', t('res.menus.col.items'))
  ]
})
