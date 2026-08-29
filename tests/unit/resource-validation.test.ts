import { describe, expect, it } from 'vitest'
import { validateInput } from '../../server/utils/resourceConfigs'

describe('validateInput (form completeness / integrity)', () => {
  it('enforces required fields on create', () => {
    const result = validateInput('users', { email: 'a@b.dev' }, 'create')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('"name" is required')
  })

  it('allows partial updates (required not re-enforced)', () => {
    const result = validateInput('users', { status: 'inactive' }, 'update')
    expect(result.ok).toBe(true)
  })

  it('rejects values outside enums', () => {
    const result = validateInput('users', { name: 'X', email: 'a@b.dev', role: 'superadmin' }, 'create')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('must be one of')
  })

  it('coerces numbers and rejects non-numeric strings', () => {
    const ok = validateInput('orders', { customerName: 'A', amount: '12.5' }, 'create')
    expect(ok.ok).toBe(true)
    if (ok.ok) expect(ok.data.amount).toBe(12.5)

    const bad = validateInput('orders', { customerName: 'A', amount: 'abc' }, 'create')
    expect(bad.ok).toBe(false)
  })

  it('skips immutable fields on update (e.g. role key)', () => {
    const result = validateInput('roles', { key: 'hacked', name: 'New' }, 'update')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.key).toBeUndefined()
      expect(result.data.name).toBe('New')
    }
  })

  it('recursively sanitizes list values (menu items keep nested children)', () => {
    const result = validateInput('menus', {
      name: 'M',
      items: [
        { label: 'A', url: '/a', children: [{ label: 'B', url: '/b', onclick: 'evil()' }] }
      ]
    }, 'create')
    expect(result.ok).toBe(true)
    if (result.ok) {
      const items = result.data.items as Array<{ children?: Array<Record<string, unknown>> }>
      expect(items[0]!.children![0]!.label).toBe('B')
      expect(items[0]!.children![0]!).not.toHaveProperty('onclick')
    }
  })

  it('rejects non-primitive values for any-typed fields (settings.value)', () => {
    const bad = validateInput('settings', { key: 'K', group: 'G', value: { nested: true } }, 'create')
    expect(bad.ok).toBe(false)
    const ok = validateInput('settings', { key: 'K', group: 'G', value: true }, 'create')
    expect(ok.ok).toBe(true)
  })

  it('never leaks unknown fields into the stored data', () => {
    const result = validateInput('users', { name: 'X', email: 'a@b.dev', isAdmin: true, password: 'x' }, 'create')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).not.toHaveProperty('isAdmin')
      expect(result.data).not.toHaveProperty('password')
    }
  })
})
