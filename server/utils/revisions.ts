import { getCollection, insertRow } from './db'

/* =============================================================
 * Revision history: automatic snapshots before destructive/
 * mutating operations. Restore endpoint re-applies old data.
 * ============================================================= */

export interface RevisionRow {
  id: number
  /** "resource:id" composite for easy lookup */
  key: string
  resource: string
  recordId: number
  version: number
  data: Record<string, unknown>
  createdAt: string
}

/** capture the current state of a record as a new revision */
export function snapshotRevision(resource: string, record: Record<string, unknown>): void {
  if (resource === 'revisions' || typeof record.id !== 'number') return
  const key = `${resource}:${record.id}`
  const existing = getCollection('revisions').filter(r => r.key === key)
  insertRow('revisions', {
    key,
    resource,
    recordId: record.id,
    version: existing.length + 1,
    data: { ...record }
  })
}
