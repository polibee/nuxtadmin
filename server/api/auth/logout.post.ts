import { clearSessionCookie, destroySession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'admin_session')
  if (token) await destroySession(token)
  clearSessionCookie(event)
  return { ok: true }
})
