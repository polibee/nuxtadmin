import { getCollection, listCollectionNames } from '../utils/db'
import { emitCmsEvent } from '../utils/events'
import { processRetryQueue } from '../utils/webhook'

/**
 * Lazy scheduler: promotes scheduled dynamic content to published and
 * drains the webhook retry queue. Runs every 15s - sufficient for demo
 * scale; swap with a queue/cron (e.g. Nitro scheduled tasks or a worker)
 * for production.
 */
export default defineNitroPlugin(() => {
  const tick = async (): Promise<void> => {
    try {
      const now = Date.now()
      for (const name of listCollectionNames()) {
        if (!name.startsWith('ct_')) continue
        for (const row of getCollection(name)) {
          if (
            row.status === 'scheduled'
            && typeof row.scheduledAt === 'string'
            && new Date(row.scheduledAt).getTime() <= now
          ) {
            row.status = 'published'
            row.publishedAt = new Date().toISOString()
            await emitCmsEvent('content.published', { resource: name, record: row })
          }
        }
      }

      await processRetryQueue()
    } catch {
      // scheduler must never crash the server
    }
  }

  setInterval(tick, 15_000)
})
