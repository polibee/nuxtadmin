import { describe, expect, it } from 'vitest'
import { applyQuery, getCollection } from '../../server/utils/db'

const users = () => getCollection('users')
const orders = () => getCollection('orders')

describe('applyQuery query engine', () => {
  it('returns newest-first by default with pagination metadata', () => {
    const page1 = applyQuery('users', {}, { searchable: ['name'] })
    expect(page1.total).toBe(users().length)
    expect(page1.items).toHaveLength(10)
    expect(page1.items[0]!.id).toBe(16) // highest id first
    expect(page1.totalPages).toBe(2)
  })

  it('searches case-insensitively across the configured fields', () => {
    const result = applyQuery('users', { q: 'HEDY' }, { searchable: ['name', 'email'] })
    expect(result.total).toBe(1)
    expect(String(result.items[0]!.name)).toContain('Hedy')

    const byEmail = applyQuery('orders', { q: 'acme' }, { searchable: ['orderNo', 'customerName'] })
    expect(byEmail.total).toBeGreaterThan(0)
    byEmail.items.forEach(o => expect(String(o.customerName).toLowerCase()).toBe('acme corp'))
  })

  it('yields an empty but valid page when nothing matches', () => {
    const result = applyQuery('users', { q: 'zzz-no-such-row' }, { searchable: ['name'] })
    expect(result.total).toBe(0)
    expect(result.items).toHaveLength(0)
    expect(result.totalPages).toBe(1) // never zero to avoid /0 in UIs
  })

  it('sorts strings ascending and descending', () => {
    const asc = applyQuery('users', { sortBy: 'name', sortDir: 'asc' }, { searchable: [] })
    const desc = applyQuery('users', { sortBy: 'name', sortDir: 'desc' }, { searchable: [] })
    const names = asc.items.map(r => String(r.name))
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
    expect(desc.items[0]!.id).not.toBe(asc.items[0]!.id)
  })

  it('sorts numeric columns numerically (orders.amount)', () => {
    const asc = applyQuery('orders', { sortBy: 'amount', sortDir: 'asc' }, { searchable: [] })
    const amounts = asc.items.map(r => Number(r.amount))
    expect([...amounts].sort((a, b) => a - b)).toEqual(amounts)
  })

  it('ignores unknown sort keys and falls back to id', () => {
    const result = applyQuery('users', { sortBy: 'hacker_field' }, { searchable: [] })
    expect(result.items[0]!.id).toBe(16)
  })

  it('paginates: second page holds the remaining rows', () => {
    const total = users().length
    const page2 = applyQuery('users', { page: 2, perPage: 10 }, { searchable: [] })
    expect(page2.page).toBe(2)
    expect(page2.items).toHaveLength(total - 10)
  })

  it('clamps perPage into [1..200] and recovers from garbage input', () => {
    const huge = applyQuery('users', { perPage: '500' as unknown as number }, { searchable: [] })
    expect(huge.perPage).toBeLessThanOrEqual(200)
    expect(huge.items.length).toBe(users().length)

    const zero = applyQuery('users', { perPage: 0 }, { searchable: [] })
    expect(zero.perPage).toBe(10)

    const junk = applyQuery('users', { perPage: 'abc' as unknown as number }, { searchable: [] })
    expect(junk.perPage).toBe(10)
  })

  it('throws 404 for unknown resources instead of leaking undefined collections', () => {
    expect(() =>
      applyQuery('secrets', {}, { searchable: [] })
    ).toThrowError(/Unknown resource/)
  })

  it('never mutates the underlying collection while sorting', () => {
    const before = orders().map(r => r.id)
    applyQuery('orders', { sortBy: 'amount', sortDir: 'asc' }, { searchable: [] })
    expect(orders().map(r => r.id)).toEqual(before)
  })
})
