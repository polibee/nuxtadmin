import { getCollection } from '../utils/db'
import { withPageCache } from '../utils/pageCache'
import { buildRssChannel, toPlainText } from '../utils/xml'

/**
 * GET /rss.xml — latest published posts as an RSS 2.0 feed.
 * Channel metadata comes from public settings (SITE_NAME/SITE_URL/SITE_DESCRIPTION).
 */
export default defineEventHandler(async (event) => {
  const settings = getCollection('settings')
  const value = (key: string, fallback: string): string =>
    String(settings.find(s => s.key === key)?.value ?? fallback)

  const origin = value('SITE_URL', '') || getRequestURL(event).origin

  const posts = getCollection('posts')
    .filter(p => p.status === 'published')
    .sort((a, b) => new Date(b.publishedAt as string ?? b.createdAt as string).getTime()
      - new Date(a.publishedAt as string ?? a.createdAt as string).getTime())
    .slice(0, 50)

  const { body } = await withPageCache('rss', async () => buildRssChannel(
    {
      title: value('SITE_NAME', 'Nuxt Admin'),
      link: origin,
      description: value('SITE_DESCRIPTION', 'Latest posts')
    },
    posts.map(p => ({
      title: String(p.title),
      url: `/blog/${p.slug}`,
      description: toPlainText(p.content),
      pubDate: (p.publishedAt as string | null) ?? (p.createdAt as string)
    }))
  ))
  setResponseHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60')
  return body
})
