/* =============================================================
 * Autosave drafts: per (resource, record, user) in-memory store.
 * Values are raw form snapshots - never validated or applied
 * automatically; restore is an explicit user action.
 * ============================================================= */

import { getKV } from './kv'

export interface AutosaveEntry {
  values: Record<string, unknown>
  savedAt: string
}

export function draftKey(resource: string, id: string, userId: number): string {
  return `${resource}:${id}:${userId}`
}

export async function saveAutosave(resource: string, id: string, userId: number, values: Record<string, unknown>): Promise<AutosaveEntry> {
  const entry: AutosaveEntry = { values, savedAt: new Date().toISOString() }
  await getKV().set(draftKey(resource, id, userId), entry, 60 * 60 * 24 * 7)
  return entry
}

export async function readAutosave(resource: string, id: string, userId: number): Promise<AutosaveEntry | undefined> {
  return (await getKV().get(draftKey(resource, id, userId))) as AutosaveEntry | undefined
}

export async function discardAutosave(resource: string, id: string, userId: number): Promise<void> {
  await getKV().del(draftKey(resource, id, userId))
}
