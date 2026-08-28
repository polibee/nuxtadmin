import { insertRow } from '../../../utils/db'
import { requirePermission } from '../../../utils/auth'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

/** multipart upload: field "file" (required) → media record + stored bytes */
export default defineEventHandler(async (event) => {
  requirePermission(event, 'media.create')

  const parts = await readMultipartFormData(event)
  const file = parts?.find(p => p.name === 'file')
  if (!file) {
    throw createError({ statusCode: 422, statusMessage: 'Multipart field "file" is required' })
  }
  if (file.data.length > MAX_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'File exceeds the 10MB limit' })
  }

  const storage = useStorage('media')
  const key = `${Date.now()}-${crypto.randomUUID()}`
  await storage.setItemRaw(key, file.data)

  const row = insertRow('media', {
    filename: file.filename ?? key,
    mime: file.type ?? 'application/octet-stream',
    size: file.data.length,
    storageKey: key,
    url: ''
  })
  row.url = `/api/admin/media/${row.id}/raw`

  return row
})
