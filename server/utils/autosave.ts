/* =============================================================
 * Autosave drafts: per (resource, record, user) in-memory store.
 * Values are raw form snapshots - never validated or applied
 * automatically; restore is an explicit user action.
 * ============================================================= */

export interface AutosaveEntry {
  values: Record<string, unknown>
  savedAt: string
}

const drafts = new Map<string, AutosaveEntry>()

export function draftKey(resource: string, id: string, userId: number): string {
  return `${resource}:${id}:${userId}`
}

export function saveAutosave(resource: string, id: string, userId: number, values: Record<string, unknown>): AutosaveEntry {
  const entry: AutosaveEntry = { values, savedAt: new Date().toISOString() }
  drafts.set(draftKey(resource, id, userId), entry)
  return entry
}

export function readAutosave(resource: string, id: string, userId: number): AutosaveEntry | undefined {
  return drafts.get(draftKey(resource, id, userId))
}

export function discardAutosave(resource: string, id: string, userId: number): boolean {
  return drafts.delete(draftKey(resource, id, userId))
}
