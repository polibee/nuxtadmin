import type { Translator } from '~/admin/core/types'

export default (t: Translator) => defineResource({
  name: 'revisions',
  model: 'Revision',
  label: t('res.revisions.label'),
  labelPlural: t('res.revisions.plural'),
  icon: 'history',
  group: t('res.revisions.group'),
  sort: 96,
  permissionPrefix: 'revisions',
  searchable: ['resource', 'key'],

  table: () => [
    textColumn('key', t('res.revisions.col.record'), { sortable: true }),
    textColumn('resource', t('res.revisions.col.resource')),
    numberColumn('version', t('res.revisions.col.version')),
    dateColumn('createdAt', t('res.revisions.col.saved'), { sortable: true }),
    actionsColumn([
      defineAction({
        name: 'restore',
        label: t('common.confirm'),
        icon: 'badge-check',
        confirm: {
          title: t('res.revisions.restore'),
          description: t('res.revisions.restoreDesc'),
          confirmLabel: t('common.confirm')
        },
        handler: async ({ record }) => {
          await $fetch(`/api/admin/revisions/${record!.id}/restore`, { method: 'POST' })
          notify(t('res.revisions.restored', { version: String(record!.version) }))
          emitAdminEvent(`${record!.resource}:refresh`)
        }
      })
    ])
  ],

  infolist: () => [
    textEntry('key', t('res.revisions.col.record')),
    textEntry('resource', t('res.revisions.col.resource')),
    textEntry('version', t('res.revisions.col.version')),
    datetimeEntry('createdAt', t('res.revisions.col.saved'))
  ]
})
