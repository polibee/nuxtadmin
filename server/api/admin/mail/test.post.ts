import { sendMail } from '../../../utils/mail'
import { requirePermission } from '../../../utils/auth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** POST /api/admin/mail/test — send a test email through the active provider */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'settings.edit')

  const body = await readBody<{ to?: string }>(event)
  const to = String(body?.to ?? '').trim()
  if (!EMAIL_RE.test(to)) {
    throw createError({ statusCode: 422, statusMessage: 'A valid "to" email address is required' })
  }

  const result = await sendMail(
    to,
    'Nuxt Admin · test email',
    '<p>This is a <strong>test email</strong> sent from the Nuxt Admin settings panel.</p>'
  )

  if (!result.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Mail delivery failed (${result.provider}): ${result.error}`
    })
  }
  return { ok: true, provider: result.provider, id: result.id }
})
