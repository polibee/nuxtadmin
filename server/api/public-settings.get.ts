import { getCollection } from '../utils/db'
import { withPageCache } from '../utils/pageCache'

/**
 * Public settings endpoint for the frontend/theme layer.
 * Only exposes settings flagged `public` and never `secret`-typed values.
 */
export default defineEventHandler(async (event) => {
  const settings = getCollection('settings')
  const exposed: Record<string, string | number | boolean> = {}
  for (const row of settings) {
    if (row.public === true && row.type !== 'secret' && typeof row.key === 'string') {
      exposed[row.key] = row.value as string | number | boolean
    }
  }
  const { body } = await withPageCache('public-settings', async () => JSON.stringify(exposed), { ttlSec: 600 })
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60')
  return JSON.parse(body)
})
