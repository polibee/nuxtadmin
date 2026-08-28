import { describe, expect, it } from 'vitest'
import { isPrivateIp, parseWebhookTarget } from '../../server/utils/webhook'

describe('isPrivateIp', () => {
  it('blocks loopback, private and reserved IPv4 ranges', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.0.9', '172.16.0.1', '172.31.255.255', '169.254.1.1', '0.0.0.0', '100.64.0.1', '224.0.0.1', '250.1.2.3']) {
      expect(isPrivateIp(ip), ip).toBe(true)
    }
  })

  it('allows public IPv4', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '172.32.0.1', '100.128.0.1', '9.9.9.9']) {
      expect(isPrivateIp(ip), ip).toBe(false)
    }
  })

  it('blocks loopback, link-local and unique-local IPv6', () => {
    for (const ip of ['::1', '::', 'fe80::1', 'fc00::1', 'fd12:3456::1']) {
      expect(isPrivateIp(ip), ip).toBe(true)
    }
  })

  it('blocks IPv4-mapped IPv6 private addresses', () => {
    expect(isPrivateIp('::ffff:127.0.0.1')).toBe(true)
    expect(isPrivateIp('::ffff:8.8.8.8')).toBe(false)
  })
})

describe('parseWebhookTarget (SSRF policy)', () => {
  it('accepts public http/https URLs', () => {
    expect(parseWebhookTarget('https://example.com/hooks')).toMatchObject({ ok: true })
    expect(parseWebhookTarget('http://example.com/hooks')).toMatchObject({ ok: true })
  })

  it('requires an http/https scheme', () => {
    for (const raw of ['ftp://example.com', 'file:///etc/passwd', 'gopher://x.io']) {
      expect(parseWebhookTarget(raw).ok).toBe(false)
    }
  })

  it('refuses localhost and local-suffix hostnames', () => {
    for (const raw of ['http://localhost:1337/hook', 'http://sub.localhost/hook', 'https://service.internal/hook', 'https://my-host.local/hook']) {
      const result = parseWebhookTarget(raw)
      expect(result.ok, raw).toBe(false)
      if (!result.ok) expect(result.message).toContain('local')
    }
  })

  it('refuses private/reserved IP literals', () => {
    for (const raw of ['http://127.0.0.1:3000/hook', 'http://10.0.0.5/hook', 'http://192.168.1.1/hook', 'http://172.20.0.1/hook', 'http://169.254.169.254/latest', 'http://[::1]/hook', 'http://0.0.0.0/hook']) {
      const result = parseWebhookTarget(raw)
      expect(result.ok, raw).toBe(false)
      if (!result.ok) expect(result.message).toContain('Refusing')
    }
  })

  it('rejects missing or malformed input', () => {
    expect(parseWebhookTarget(undefined).ok).toBe(false)
    expect(parseWebhookTarget('').ok).toBe(false)
    expect(parseWebhookTarget('   ').ok).toBe(false)
    expect(parseWebhookTarget('not-a-url').ok).toBe(false)
  })
})
