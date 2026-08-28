export default defineResource({
  name: 'webhooks',
  model: 'Webhook',
  label: 'Webhook',
  labelPlural: 'Webhooks',
  icon: 'globe',
  group: 'System',
  sort: 94,
  permissionPrefix: 'webhooks',
  searchable: ['url', 'events'],

  table: () => [
    textColumn('url', 'URL'),
    tagsColumn('events', 'Events'),
    booleanColumn('enabled', 'Enabled'),
    actionsColumn([
      defineAction({
        name: 'test-fire',
        label: 'Send Test',
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
    section('Endpoint', [
      textInput('url', 'Payload URL', {
        required: true,
        placeholder: 'https://example.com/hooks/cms',
        colSpan: 2,
        helpText: 'http/https only. localhost and private/reserved addresses are refused.'
      })
    ]),
    section('Subscription', [
      textInput('events', 'Events (csv)', {
        required: true,
        colSpan: 2,
        defaultValue: 'content.published',
        helpText: 'e.g. content.published, content.updated, content.afterDelete — or * for all.'
      }),
      switchInput('enabled', 'Enabled', { defaultValue: true }),
      textInput('secret', 'Secret (optional, sent as x-webhook-secret)')
    ])
  ],

  infolist: () => [
    linkEntry('url', 'URL'),
    textEntry('events', 'Events'),
    booleanEntry('enabled', 'Enabled'),
    textEntry('secret', 'Secret')
  ]
})
