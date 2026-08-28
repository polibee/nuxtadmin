import WebhookResource from './admin/WebhookResource'

export default defineModule({
  name: 'webhooks',
  resources: [WebhookResource],
  navGroups: [{ label: 'System', sort: 90 }]
})
