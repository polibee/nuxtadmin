export default defineResource({
  name: 'roles',
  model: 'Role',
  label: 'Role',
  labelPlural: 'Roles',
  icon: 'key',
  group: 'System',
  sort: 91,
  permissionPrefix: 'roles',
  searchable: ['name'],

  table: () => [
    textColumn('name', 'Name', { sortable: true }),
    textColumn('key', 'Key'),
    tagsColumn('permissions', 'Permissions'),
    actionsColumn([
      defineAction({
        name: 'reload-permissions',
        label: 'Reload Session',
        icon: 'activity',
        permission: 'roles.edit',
        confirm: {
          title: 'Reload the app to apply permission changes?',
          description: 'Sessions cache permissions at login. Reloading re-syncs the current session.',
          confirmLabel: 'Reload'
        },
        handler: async () => {
          reloadNuxtApp()
        }
      })
    ])
  ],

  form: () => [
    section('Identity', [
      grid(2, [
        textInput('name', 'Name', { required: true, placeholder: 'Moderator' }),
        textInput('key', 'Key', { placeholder: 'moderator', helpText: 'Immutable role key, e.g. used in user records.' })
      ])
    ]),
    section('Permissions', [
      permissionsInput('permissions', 'Granted Permissions')
    ])
  ],

  infolist: () => [
    textEntry('name', 'Name'),
    textEntry('key', 'Key'),
    tagsEntry('permissions', 'Permissions')
  ]
})
