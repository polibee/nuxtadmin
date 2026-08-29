export default defineResource({
  name: 'content-types',
  model: 'ContentType',
  label: 'Content Type',
  labelPlural: 'Content Types',
  icon: 'box',
  group: 'System',
  sort: 92,
  permissionPrefix: 'content-types',
  searchable: ['name'],

  table: () => [
    textColumn('name', 'Name', { sortable: true }),
    textColumn('slug', 'Slug'),
    tagsColumn('fields', 'Fields'),
    dateColumn('createdAt', 'Created', { sortable: true }),
    actionsColumn([
      defineAction({
        name: 'reload-registry',
        label: 'Reload Registry',
        icon: 'activity',
        permission: 'content-types.edit',
        handler: async () => {
          notify('Reloading registry…')
          reloadNuxtApp()
        }
      })
    ])
  ],

  form: () => [
    section('Identity', [
      grid(2, [
        textInput('name', 'Name', { required: true, placeholder: 'Product' }),
        textInput('slug', 'Slug', { placeholder: 'Auto-generated if empty', helpText: 'Collection identifier, immutable after create.' })
      ])
    ]),
    section('Fields', [
      repeaterInput('fields', 'Add Field', [
        textInput('name', 'Field name', { required: true, placeholder: 'title' }),
        textInput('label', 'Label', { required: true, placeholder: 'Title' }),
        selectInput('type', 'Type', [
          { label: 'Text', value: 'string' },
          { label: 'Number', value: 'number' },
          { label: 'Boolean', value: 'boolean' },
          { label: 'Select', value: 'select' },
          { label: 'Date', value: 'date' },
          { label: 'Rich Text', value: 'richtext' }
        ], { defaultValue: 'string' }),
        textInput('options', 'Options (csv, select only)', { placeholder: 'foo,bar,baz' }),
        switchInput('required', 'Required')
      ])
    ])
  ],

  infolist: () => [
    textEntry('name', 'Name'),
    textEntry('slug', 'Slug'),
    tagsEntry('fields', 'Fields'),
    datetimeEntry('createdAt', 'Created')
  ]
})
