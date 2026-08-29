import type { Translator } from '~/admin/core/types'

export default (t: Translator) => defineResource({
  name: 'webhooks',
  model: 'Webhook',
  label: t('res.webhooks.label'),
  labelPlural: t('res.webhooks.plural'),
  icon: 'globe',
  group: t('res.webhooks.group'),
  sort: 94,
  permissionPrefix: 'webhooks',
  searchable: ['url', 'events'],

  table: () => [
    textColumn('url', t('res.webhooks.col.url')),
    tagsColumn('events', t('res.webhooks.col.events')),
    booleanColumn('enabled', t('res.webhooks.field.enabled')),
    actionsColumn([
      defineAction({
        name: 'test-fire',
        label: t('res.webhooks.sendTest'),
        icon: 'activity',
        permission: 'webhooks.edit',
        visible: record => Boolean(record.enabled),
        handler: async ({ record }) => {
          await $fetch(`/api/admin/webhooks/${record!.id}/test`, { method: 'POST' })
          notify('Test event dispatched')
        }
      })
    ])
  ],

  form: () => [
    section(t('res.webhooks.section.endpoint'), [
      textInput('url', 'Payload URL', {
        required: true,
        placeholder: 'https://example.com/hooks/cms',
        colSpan: 2,
        helpText: t('res.webhooks.urlHelp')
      })
    ]),
    section(t('res.webhooks.section.subscription'), [
      textInput('events', t('res.webhooks.field.events'), {
        required: true,
        colSpan: 2,
        defaultValue: 'content.published',
        helpText: t('res.webhooks.eventsHelp')
      }),
      switchInput('enabled', t('res.webhooks.field.enabled'), { defaultValue: true }),
      textInput('secret', t('res.webhooks.field.secret'))
    ])
  ],

  infolist: () => [
    linkEntry('url', t('res.webhooks.col.url')),
    textEntry('events', t('res.webhooks.col.events')),
    booleanEntry('enabled', t('res.webhooks.field.enabled')),
    textEntry('secret', t('res.webhooks.field.secret'))
  ]
})
