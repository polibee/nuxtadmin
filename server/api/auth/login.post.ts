import { createSession, setSessionCookie } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string, password?: string }>(event)

  if (!body?.email || !body?.password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
  }

  const session = createSession(body.email, body.password)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  setSessionCookie(event, session.token)
  return { user: session.user }
})
