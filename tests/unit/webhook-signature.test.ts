import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { signPayload } from '../../server/utils/webhook'

describe('webhook HMAC signature', () => {
  it('signs with sha256 prefix over the exact body', () => {
    const body = JSON.stringify({ event: 'content.published', sentAt: '2026-08-29T00:00:00.000Z' })
    const expected = `sha256=${createHmac('sha256', 'unit-test-secret').update(body).digest('hex')}`
    expect(signPayload('unit-test-secret', body)).toBe(expected)
  })

  it('is body-sensitive (any change flips the signature)', () => {
    const a = signPayload('s', JSON.stringify({ n: 1 }))
    const b = signPayload('s', JSON.stringify({ n: 2 }))
    expect(a).not.toBe(b)
  })

  it('is secret-sensitive', () => {
    const body = '{"x":1}'
    expect(signPayload('secret-a', body)).not.toBe(signPayload('secret-b', body))
  })
})
