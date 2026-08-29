import { findRow } from '../../../utils/db'
import { escapeHtml } from '../../../utils/xml'
import { sanitizeRichText } from '../../../utils/sanitize'
import { isPreviewableResource, readPreviewToken } from '../../../utils/preview'

/**
 * GET /preview/:resource/:id?t=<token> — token-gated draft preview.
 * Renders a minimal standalone HTML page (noindex) that the future
 * theme layer can replace with a real route.
 */
export default defineEventHandler((event) => {
  const resource = getRouterParam(event, 'resource')!
  const id = Number(getRouterParam(event, 'id'))

  const tokened = readPreviewToken(getQuery(event).t as string | undefined)
  if (!tokened || tokened.resource !== resource || tokened.id !== id || !isPreviewableResource(resource)) {
    throw createError({ statusCode: 404, statusMessage: 'Preview not found or expired' })
  }

  const row = findRow(resource, id)
  const title = String(row.seoTitle || row.title || row.name || `Preview #${id}`)
  const description = String(row.seoDescription ?? '')
  // rich text is server-sanitized at save time AND here (defense in depth)
  const body = sanitizeRichText(String(row.content ?? ''))
  const minutes = Math.max(1, Math.ceil(15))

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>[Preview] ${escapeHtml(title)}</title>
<style>
  body{font-family:ui-sans-serif,system-ui,sans-serif;max-width:720px;margin:0 auto;padding:2rem 1.25rem;color:#111}
  .banner{display:flex;gap:.75rem;align-items:center;background:#fef3c7;border:1px solid #f59e0b55;border-radius:.75rem;padding:.75rem 1rem;font-size:.85rem;margin-bottom:2rem}
  .badge{background:#111;color:#fff;border-radius:999px;padding:.15rem .6rem;font-size:.7rem;font-weight:600}
  h1{font-size:1.75rem;line-height:1.25;margin:0 0 .5rem}
  .desc{color:#555;margin:0 0 1.5rem}
  article{white-space:pre-wrap;line-height:1.7;font-size:1rem}
</style>
</head>
<body>
<div class="banner"><span class="badge">PREVIEW</span><span>This is a draft preview — it expires in ~${minutes} minutes and is not indexed.</span></div>
<h1>${escapeHtml(title)}</h1>
${description ? `<p class="desc">${escapeHtml(description)}</p>` : ''}
<article>${body}</article>
</body>
</html>`

  setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  return html
})
