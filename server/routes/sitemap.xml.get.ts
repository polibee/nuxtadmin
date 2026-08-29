import { getCollection, listCollectionNames } from '../utils/db'
import { buildUrlSet, type SitemapUrl } from '../utils/xml'

/**
 * GET /sitemap.xml — home + published posts + published dynamic
 * content entries (robots=noindex excluded). URL schemes for ct_*
 * collections are placeholders until the theme layer defines them.
 */
export default defineEventHandler((event) => {
  const settings = getCollection('settings')
  const siteUrl = String(settings.find(s => s.key === 'SITE_URL')?.value ?? '')
  const origin = siteUrl || getRequestURL(event).origin

  const urls: SitemapUrl[] = [{ loc: '/', changefreq: 'daily', priority: 1 }]

  const posts = getCollection('posts').filter(p => p.status === 'published')
  for (const post of posts) {
    urls.push({
      loc: `/blog/${post.slug}`,
      lastmod: (post.publishedAt as string | null) ?? (post.createdAt as string),
      changefreq: 'weekly',
      priority: 0.8
    })
  }

  for (const name of listCollectionNames()) {
    if (!name.startsWith('ct_')) continue
    const slug = name.slice(3)
    for (const row of getCollection(name)) {
      if (row.status !== 'published' || row.robots === 'noindex') continue
      urls.push({
        loc: `/${slug}/${row.id}`,
        lastmod: (row.publishedAt as string | null) ?? (row.createdAt as string),
        changefreq: 'weekly',
        priority: 0.6
      })
    }
  }

  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return buildUrlSet(origin, urls)
})
