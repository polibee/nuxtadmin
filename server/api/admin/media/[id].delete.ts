import { deleteRows, findRow } from '../../../utils/db'
import { requirePermission } from '../../../utils/auth'

interface MediaLike {
  id: number
  storageKey: string | null
}

/** media delete override: also purges the stored file */
export default defineEventHandler(async (event) => {
  requirePermission(event, 'media.delete')

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const row = findRow('media', id) as unknown as MediaLike
  if (row.storageKey) {
    await useStorage('media').removeItem(row.storageKey).catch(() => undefined)
  }

  const removed = deleteRows('media', [id])
  return { removed }
})
