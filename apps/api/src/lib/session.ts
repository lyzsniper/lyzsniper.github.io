import { randomBytes } from 'node:crypto'

/**
 * 极简有状态 session：内存 Map。
 * 单实例够用；多实例部署可后面换 Redis。
 */
interface Session {
  username: string
  role: string
  createdAt: number
}

const sessions = new Map<string, Session>()
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 天

export function createSession(username: string, role: string): string {
  const token = randomBytes(32).toString('hex')
  sessions.set(token, { username, role, createdAt: Date.now() })
  return token
}

export function getSession(token: string): Session | null {
  const s = sessions.get(token)
  if (!s) return null
  if (Date.now() - s.createdAt > SESSION_TTL_MS) {
    sessions.delete(token)
    return null
  }
  return s
}

export function destroySession(token: string): void {
  sessions.delete(token)
}

export function cleanExpiredSessions(): void {
  const now = Date.now()
  for (const [token, s] of sessions) {
    if (now - s.createdAt > SESSION_TTL_MS) sessions.delete(token)
  }
}
