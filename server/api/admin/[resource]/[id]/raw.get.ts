import { findRow } from '../../../../utils/db'
import { requirePermission } from '../../../../utils/auth'

interface MediaLike {
  storageKey: string | null
  mime: string
}

/** GET /api/admin/media/:id/raw — stream stored bytes */
export default defineEventHandler(async (event) => {
  const resource = getRouterParam(event, 'resource')!
  if (resource !== 'media') {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  await requirePermission(event, 'media.view')

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const row = findRow('media', id) as unknown as MediaLike
  if (!row.storageKey) {
    throw createError({ statusCode: 404, statusMessage: 'No stored file for this record' })
  }

  const data = await useStorage('media').getItemRaw(row.storageKey)
  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'File missing from storage' })
  }

  setResponseHeader(event, 'Content-Type', row.mime)
  setResponseHeader(event, 'Cache-Control', 'private, max-age=3600')
  return data
})
