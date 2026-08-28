export default defineResource({
  name: 'revisions',
  model: 'Revision',
  label: 'Revision',
  labelPlural: 'Revisions',
  icon: 'history',
  group: 'System',
  sort: 96,
  permissionPrefix: 'revisions',
  searchable: ['resource', 'key'],

  table: () => [
    textColumn('key', 'Record', { sortable: true }),
    textColumn('resource', 'Resource'),
    numberColumn('version', 'Version'),
    dateColumn('createdAt', 'Saved', { sortable: true }),
    actionsColumn([
      defineAction({
        name: 'restore',
        label: 'Restore',
        icon: 'badge-check',
        confirm: {
          title: 'Restore this revision?',
          description: 'The current state is snapshotted first, then the selected version is re-applied.',
          confirmLabel: 'Restore'
        },
        handler: async ({ record }) => {
          await $fetch(`/api/admin/revisions/${record!.id}/restore`, { method: 'POST' })
          notify(`Revision #${record!.version} restored`)
          emitAdminEvent(`${record!.resource}:refresh`)
        }
      })
    ])
  ],

  infolist: () => [
    textEntry('key', 'Record'),
    textEntry('resource', 'Resource'),
    textEntry('version', 'Version'),
    datetimeEntry('createdAt', 'Saved')
  ]
})
