/* =============================================================
 * XML/HTML generation helpers for sitemap.xml, rss.xml and the
 * preview pages. Generation only - no XML is ever parsed here.
 * ============================================================= */

export function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&apos;')
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;')
}

export interface SitemapUrl {
  loc: string
  lastmod?: string | null
  changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  priority?: number
}

export function buildUrlSet(origin: string, urls: SitemapUrl[]): string {
  const originClean = origin.replace(/\/+$/, '')
  const body = urls.map((u) => {
    const parts = [`<loc>${escapeXml(originClean + u.loc)}</loc>`]
    if (u.lastmod) parts.push(`<lastmod>${escapeXml(new Date(u.lastmod).toISOString())}</lastmod>`)
    if (u.changefreq) parts.push(`<changefreq>${u.changefreq}</changefreq>`)
    if (u.priority !== undefined) parts.push(`<priority>${u.priority.toFixed(1)}</priority>`)
    return `  <url>\n    ${parts.join('\n    ')}\n  </url>`
  })
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...body,
    '</urlset>',
    ''
  ].join('\n')
}

export interface RssItem {
  title: string
  url: string
  description?: string
  pubDate?: string | null
  guid?: string
}

export function buildRssChannel(
  channel: { title: string, link: string, description: string },
  items: RssItem[]
): string {
  const originClean = channel.link.replace(/\/+$/, '')
  const body = items.map((item) => {
    const parts = [
      `<title>${escapeXml(item.title)}</title>`,
      `<link>${escapeXml(originClean + item.url)}</link>`,
      `<guid>${escapeXml(item.guid ?? originClean + item.url)}</guid>`
    ]
    if (item.description) parts.push(`<description>${escapeXml(item.description)}</description>`)
    if (item.pubDate) parts.push(`<pubDate>${new Date(item.pubDate).toUTCString()}</pubDate>`)
    return `    <item>\n      ${parts.join('\n      ')}\n    </item>`
  })
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${escapeXml(channel.title)}</title>`,
    `    <link>${escapeXml(originClean)}</link>`,
    `    <description>${escapeXml(channel.description)}</description>`,
    ...body,
    '  </channel>',
    '</rss>',
    ''
  ].join('\n')
}

/** plain-text extract of markdown-ish content for rss descriptions */
export function toPlainText(markdown: unknown, max = 280): string {
  const text = String(markdown ?? '')
    .replace(/#+\s?/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}
