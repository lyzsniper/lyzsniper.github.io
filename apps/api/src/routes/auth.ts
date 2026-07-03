import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getDb } from '../db/sqlite.js'
import { verifyPassword } from '../lib/password.js'
import { createSession, getSession, destroySession } from '../lib/session.js'

const COOKIE_NAME = 'blog_session'

interface UserRow {
  id: number
  username: string
  password: string
  role: string
}

function findUser(username: string): UserRow | undefined {
  return getDb()
    .prepare('SELECT id, username, password, role FROM users WHERE username = ?')
    .get(username) as UserRow | undefined
}

function readSessionToken(req: FastifyRequest): string | null {
  const cookie = req.cookies?.[COOKIE_NAME]
  if (cookie) return cookie
  // fallback: Authorization: Bearer <token>
  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return null
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/auth/me — 当前登录态
  app.get('/me', async (req: FastifyRequest, reply: FastifyReply) => {
    const token = readSessionToken(req)
    if (!token) return reply.code(401).send({ error: 'not authenticated' })
    const session = getSession(token)
    if (!session) return reply.code(401).send({ error: 'session expired' })
    return { user: { username: session.username, role: session.role } }
  })

  // POST /api/auth/login
  app.post<{ Body: { username: string; password: string } }>(
    '/login',
    async (req: FastifyRequest<{ Body: { username: string; password: string } }>, reply: FastifyReply) => {
      const { username, password } = req.body ?? {}
      if (!username || !password) {
        return reply.code(400).send({ error: 'username and password required' })
      }
      const user = findUser(username)
      // 即使用户不存在也做一次伪校验，避免时序泄漏
      const ok = user
        ? verifyPassword(password, user.password)
        : verifyPassword(password, '00:00')
      if (!ok || !user) {
        return reply.code(401).send({ error: 'invalid credentials' })
      }
      // 更新 last_login
      getDb().prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id)
      const sessionToken = createSession(user.username, user.role)
      reply.setCookie(COOKIE_NAME, sessionToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === 'production',
      })
      return { ok: true, user: { username: user.username, role: user.role } }
    },
  )

  // POST /api/auth/logout
  app.post('/logout', async (req: FastifyRequest, reply: FastifyReply) => {
    const token = readSessionToken(req)
    if (token) destroySession(token)
    reply.clearCookie(COOKIE_NAME, { path: '/' })
    return { ok: true }
  })
}

/** preHandler：要求已登录 */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = readSessionToken(req)
  if (!token) {
    reply.code(401).send({ error: 'authentication required' })
    return
  }
  const session = getSession(token)
  if (!session) {
    reply.code(401).send({ error: 'session expired' })
    return
  }
  ;(req as FastifyRequest & { user?: { username: string; role: string } }).user = {
    username: session.username,
    role: session.role,
  }
}

/** preHandler：要求 admin 角色 */
export async function requireAdmin(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  await requireAuth(req, reply)
  if (reply.sent) return
  const user = (req as FastifyRequest & { user?: { role: string } }).user
  if (user?.role !== 'admin') {
    reply.code(403).send({ error: 'admin only' })
  }
}
