import { describe, expect, it } from 'vitest'
import { sanitizeRichText } from '../../server/utils/sanitize'

describe('sanitizeRichText (XSS whitelist)', () => {
  it('strips script tags entirely', () => {
    const out = sanitizeRichText('<p>ok</p><script>alert(1)</script>')
    expect(out).toBe('<p>ok</p>')
    expect(out).not.toContain('alert')
  })

  it('strips event handlers and javascript: URLs', () => {
    const out = sanitizeRichText('<p onclick="evil()">x</p><a href="javascript:evil()">y</a>')
    expect(out).not.toContain('onclick')
    expect(out).not.toContain('javascript:')
  })

  it('keeps whitelisted formatting and link hardening', () => {
    const out = sanitizeRichText('<h2>T</h2><ul><li>i</li></ul><blockquote>q</blockquote><a href="https://e.com/x">l</a>')
    expect(out).toContain('<h2>')
    expect(out).toContain('<li>')
    expect(out).toContain('<blockquote>')
    expect(out).toContain('rel="noopener noreferrer nofollow"')
  })

  it('keeps table markup for editor-produced tables', () => {
    const out = sanitizeRichText('<table><tr><th>H</th></tr><tr><td>C</td></tr></table>')
    expect(out).toContain('<table>')
    expect(out).toContain('<th>')
    expect(out).toContain('<td>')
  })

  it('keeps sanitized inline styles (text-align/color) only', () => {
    const keep = sanitizeRichText('<p style="text-align:center;color:#d64545">x</p>')
    expect(keep).toContain('text-align:center')
    const drop = sanitizeRichText('<p style="position:fixed;top:0">x</p>')
    expect(drop).not.toContain('position')
  })
})
