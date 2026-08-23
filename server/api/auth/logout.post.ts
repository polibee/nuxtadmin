import { clearSessionCookie, destroySession } from '../../utils/auth'

export default defineEventHandler((event) => {
  const token = getCookie(event, 'admin_session')
  if (token) destroySession(token)
  clearSessionCookie(event)
  return { ok: true }
})
