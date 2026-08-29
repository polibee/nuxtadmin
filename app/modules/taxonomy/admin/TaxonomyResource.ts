export default defineResource({
  name: 'taxonomy',
  model: 'Term',
  label: 'Term',
  labelPlural: 'Taxonomy',
  icon: 'tag',
  group: 'Content Structure',
  sort: 45,
  permissionPrefix: 'taxonomy',
  searchable: ['name', 'slug'],

  table: () => [
    treeColumn('name', 'Name'),
    badgeColumn('key', 'Type', {
      category: { label: 'Category', variant: 'default' },
      tag: { label: 'Tag', variant: 'secondary' }
    }),
    textColumn('slug', 'Slug'),
    numberColumn('childCount', 'Children')
  ],

  form: () => [
    section('Term', [
      grid(2, [
        textInput('name', 'Name', { required: true, placeholder: 'Artificial Intelligence' }),
        selectInput('key', 'Type', [
          { label: 'Category', value: 'category' },
          { label: 'Tag', value: 'tag' }
        ], { defaultValue: 'category' }),
        textInput('slug', 'Slug', { placeholder: 'Auto-derivable: artificial-intelligence' }),
        relationInput('parentId', 'Parent', { resource: 'taxonomy', labelKey: 'name' }, { placeholder: 'None (root)' })
      ])
    ])
  ],

  infolist: () => [
    textEntry('name', 'Name'),
    textEntry('path', 'Path'),
    badgeEntry('key', 'Type', {
      category: { label: 'Category', variant: 'default' },
      tag: { label: 'Tag', variant: 'secondary' }
    }),
    textEntry('slug', 'Slug'),
    textEntry('childCount', 'Children')
  ]
})
