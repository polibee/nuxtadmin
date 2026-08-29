import WebhookResource from './admin/WebhookResource'

export default defineModule(t => ({
  name: 'webhooks',
  resources: [WebhookResource(t)],
  navGroups: [{ label: t('res.webhooks.group'), sort: 94 }]
}))
