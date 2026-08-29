import type { Translator } from '~/admin/core/types'

export default (t: Translator) => defineResource({
  name: 'roles',
  model: 'Role',
  label: t('res.roles.label'),
  labelPlural: t('res.roles.plural'),
  icon: 'key',
  group: t('res.roles.group'),
  sort: 91,
  permissionPrefix: 'roles',
  searchable: ['name'],

  table: () => [
    textColumn('name', t('res.roles.field.name'), { sortable: true }),
    textColumn('key', t('res.roles.field.key')),
    tagsColumn('permissions', t('res.roles.col.permissions')),
    actionsColumn([
      defineAction({
        name: 'reload-permissions',
        label: t('res.roles.reloadSession'),
        icon: 'activity',
        permission: 'roles.edit',
        confirm: {
          title: t('res.roles.reloadConfirm'),
          description: t('res.roles.reloadDesc'),
          confirmLabel: 'Reload'
        },
        handler: async () => {
          reloadNuxtApp()
        }
      })
    ])
  ],

  form: () => [
    section(t('res.roles.section.identity'), [
      grid(2, [
        textInput('name', t('res.roles.field.name'), { required: true, placeholder: 'Moderator' }),
        textInput('key', t('res.roles.field.key'), { placeholder: 'moderator', helpText: t('res.roles.keyHint') })
      ])
    ]),
    section(t('res.roles.section.permissions'), [
      permissionsInput('permissions', t('res.roles.granted'))
    ])
  ],

  infolist: () => [
    textEntry('name', t('res.roles.field.name')),
    textEntry('key', t('res.roles.field.key')),
    tagsEntry('permissions', t('res.roles.col.permissions'))
  ]
})
