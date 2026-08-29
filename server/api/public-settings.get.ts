import { getCollection } from '../utils/db'

/**
 * Public settings endpoint for the frontend/theme layer.
 * Only exposes settings flagged `public` and never `secret`-typed values.
 */
export default defineEventHandler(() => {
  const settings = getCollection('settings')
  const exposed: Record<string, string | number | boolean> = {}
  for (const row of settings) {
    if (row.public === true && row.type !== 'secret' && typeof row.key === 'string') {
      exposed[row.key] = row.value as string | number | boolean
    }
  }
  return exposed
})
