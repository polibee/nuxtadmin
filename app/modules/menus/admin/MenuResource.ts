export default defineResource({
  name: 'menus',
  model: 'Menu',
  label: 'Menu',
  labelPlural: 'Menus',
  icon: 'menu',
  group: 'Content Structure',
  sort: 46,
  permissionPrefix: 'menus',
  searchable: ['name'],

  table: () => [
    textColumn('name', 'Name', { sortable: true }),
    badgeColumn('location', 'Location', {
      header: { label: 'Header', variant: 'default' },
      footer: { label: 'Footer', variant: 'secondary' },
      custom: { label: 'Custom', variant: 'warning' }
    }),
    numberColumn('itemCount', 'Items')
  ],

  form: () => [
    section('Definition', [
      grid(2, [
        textInput('name', 'Name', { required: true, placeholder: 'Main Navigation' }),
        selectInput('location', 'Location', [
          { label: 'Header', value: 'header' },
          { label: 'Footer', value: 'footer' },
          { label: 'Custom', value: 'custom' }
        ], { defaultValue: 'header' })
      ])
    ]),
    section('Menu Items (nested)', [
      repeaterInput('items', 'Add Item', [
        textInput('label', 'Label', { required: true, placeholder: 'Blog' }),
        textInput('url', 'URL', { required: true, placeholder: '/blog' }),
        repeaterInput('children', 'Add Child', [
          textInput('label', 'Label', { required: true }),
          textInput('url', 'URL', { required: true })
        ])
      ])
    ])
  ],

  infolist: () => [
    textEntry('name', 'Name'),
    badgeEntry('location', 'Location', {
      header: { label: 'Header', variant: 'default' },
      footer: { label: 'Footer', variant: 'secondary' },
      custom: { label: 'Custom', variant: 'warning' }
    }),
    textEntry('itemCount', 'Items')
  ]
})
