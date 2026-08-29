import { getCollection } from './db'

/** Upsert a settings row by key, or update when the value is empty is skipped by caller. */
export function upsertSettingByKey(key: string, value: string | number | boolean, opts?: { secret?: boolean, group?: string }): void {
  const rows = getCollection('settings') as Array<Record<string, unknown>>
  const existing = rows.find(s => s.key === key)
  if (existing) {
    existing.value = value
    return
  }
  const maxId = rows.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0)
  rows.unshift({
    id: maxId + 1,
    key,
    value,
    type: opts?.secret ? 'secret' : 'string',
    group: opts?.group ?? 'Storage',
    public: false,
    description: `Managed via the Database settings panel (${key})`
  })
  // keep the memory sequence in sync is not needed here: settings rows use stable ids
}
