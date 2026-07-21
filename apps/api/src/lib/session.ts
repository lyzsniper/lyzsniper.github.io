import { randomBytes } from 'node:crypto'
import { getDb } from '../db/sqlite.js'

/**
 * Session 存到 SQLite 而不是内存 Map —— 之前用内存，tsx watch / 任何重启
 * 都会让所有用户掉线（cookie 还在但 token 找不到了 → "session expired"）。
 *
 * 持久化方案：单实例 DB，无须 Redis 之类外部依赖。
 */

interface Session {
  username: string
  role: string
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 天

export function createSession(username: string, role: string): string {
  const token = randomBytes(32).toString('hex')
  const now = Date.now()
  getDb()
    .prepare(
      'INSERT INTO sessions (token, username, role, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
    )
    .run(token, username, role, now, now + SESSION_TTL_MS)
  return token
}

export function getSession(token: string): Session | null {
  if (!token) return null
  const now = Date.now()
  const row = getDb()
    .prepare(
      'SELECT username, role, expires_at FROM sessions WHERE token = ? AND expires_at > ?',
    )
    .get(token, now) as { username: string; role: string; expires_at: number } | undefined
  if (!row) {
    // 顺手清理掉这个 token（如果它已过期则留着反而无意义）
    try {
      getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token)
    } catch {
      /* best effort */
    }
    return null
  }
  // 滑动过期：命中即续期 7 天，避免用户长期使用时被突然踢出
  try {
    getDb()
      .prepare('UPDATE sessions SET expires_at = ? WHERE token = ?')
      .run(now + SESSION_TTL_MS, token)
  } catch {
    /* 不影响本次鉴权 */
  }
  return { username: row.username, role: row.role }
}

export function destroySession(token: string): void {
  if (!token) return
  try {
    getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token)
  } catch {
    /* best effort */
  }
}

/** 可选：清理全部过期 token。错误时静默。 */
export function cleanExpiredSessions(): void {
  try {
    getDb().prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now())
  } catch {
    /* best effort */
  }
}
