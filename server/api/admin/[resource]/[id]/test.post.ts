import { findRow } from '../../../../utils/db'
import { emitCmsEvent } from '../../../../utils/events'
import { fireWebhook } from '../../../../utils/webhook'

/** POST /api/admin/webhooks/:id/test — fire a ping directly at this hook */
export default defineEventHandler(async (event) => {
  const resource = getRouterParam(event, 'resource')!
  if (resource !== 'webhooks') {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }
  const hook = findRow('webhooks', id)

  try {
    await fireWebhook(hook, 'webhook.test', { webhookId: id, url: hook.url })
  } catch (e: unknown) {
    throw createError({
      statusCode: 502,
      statusMessage: `Test dispatch failed: ${(e as Error).message}`
    })
  }

  await emitCmsEvent('webhook.test', { webhookId: id, url: hook.url })
  return { ok: true }
})
