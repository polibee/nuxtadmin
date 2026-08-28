import { findRow, updateRow } from '../../../../utils/db'
import { getConfig } from '../../../../utils/resourceConfigs'
import { requirePermission } from '../../../../utils/auth'
import { emitCmsEvent } from '../../../../utils/events'
import { snapshotRevision } from '../../../../utils/revisions'

interface RevisionLike {
  id: number
  resource: string
  recordId: number
  version: number
  data: Record<string, unknown>
}

/** POST /api/admin/revisions/:id/restore — re-apply a snapshot */
export default defineEventHandler(async (event) => {
  const resource = getRouterParam(event, 'resource')!
  if (resource !== 'revisions') {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const revision = findRow('revisions', id) as unknown as RevisionLike
  const cfg = getConfig(revision.resource)
  requirePermission(event, `${cfg.permissionPrefix}.edit`)

  const current = findRow(revision.resource, revision.recordId)
  snapshotRevision(revision.resource, current)

  const patch = { ...revision.data }
  delete patch.id
  delete patch.createdAt

  const restored = updateRow(revision.resource, revision.recordId, patch)
  await emitCmsEvent('content.restored', {
    resource: revision.resource,
    id: revision.recordId,
    record: restored,
    revision: revision.version
  })
  return restored
})
