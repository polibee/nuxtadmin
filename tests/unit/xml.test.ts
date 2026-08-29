import { describe, expect, it } from 'vitest'
import { buildRssChannel, buildUrlSet, escapeHtml, escapeXml, toPlainText } from '../../server/utils/xml'

describe('xml/html generation helpers', () => {
  it('escapes XML entities', () => {
    expect(escapeXml('<title>Tom & "Jerry"\'s</title>'))
      .toBe('&lt;title&gt;Tom &amp; &quot;Jerry&quot;&apos;s&lt;/title&gt;')
  })

  it('escapes HTML entities', () => {
    expect(escapeHtml('<script>alert("x")</script>'))
      .toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
  })

  it('builds a valid urlset with escaped locations', () => {
    const xml = buildUrlSet('https://example.com/', [
      { loc: '/', priority: 1 },
      { loc: '/blog/it?s "here"', lastmod: '2026-08-29T00:00:00.000Z' }
    ])
    expect(xml).toContain('<?xml version="1.0"')
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml).toContain('<loc>https://example.com/</loc>')
    expect(xml).toContain('<loc>https://example.com/blog/it?s &quot;here&quot;</loc>')
    expect(xml).toContain('<lastmod>2026-08-29T00:00:00.000Z</lastmod>')
    expect(xml).not.toContain('<!DOCTYPE')
  })

  it('builds an RSS channel without DOCTYPE and with escaped items', () => {
    const xml = buildRssChannel(
      { title: 'Blog & News', link: 'https://example.com', description: '<desc>' },
      [{ title: 'Post <1>', url: '/blog/post-1', description: 'a & b', pubDate: '2026-08-29T00:00:00.000Z' }]
    )
    expect(xml).toContain('<rss version="2.0">')
    expect(xml).toContain('<title>Blog &amp; News</title>')
    expect(xml).toContain('<description>&lt;desc&gt;</description>')
    expect(xml).toContain('<title>Post &lt;1&gt;</title>')
    expect(xml).toContain('<pubDate>')
    expect(xml).not.toContain('<!DOCTYPE')
  })

  it('strips markdown headings and truncates plain text', () => {
    expect(toPlainText('## Hello\n\nWorld')).toBe('Hello World')
    expect(toPlainText('x'.repeat(500)).length).toBeLessThanOrEqual(280)
  })
})
