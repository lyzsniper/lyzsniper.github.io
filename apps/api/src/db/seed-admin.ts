/**
 * 创建初始 admin 账号
 *
 * 用法:
 *   pnpm --filter @blog/api exec tsx src/db/seed-admin.ts
 * 或带参数:
 *   ADMIN_USER=admin ADMIN_PASS=admin123 pnpm ...
 */
import { getDb, initDb, closeDb } from './sqlite.js'
import { hashPassword } from '../lib/password.js'
import { logger } from '../lib/logger.js'

const username = process.env.ADMIN_USER ?? 'admin'
const password = process.env.ADMIN_PASS ?? 'admin123'

initDb()

const existing = getDb().prepare('SELECT id FROM users WHERE username = ?').get(username)
if (existing) {
  logger.info({ username }, 'admin user already exists, skip')
  closeDb()
  process.exit(0)
}

getDb()
  .prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
  .run(username, hashPassword(password), 'admin')

logger.info({ username }, '✅ admin user created')
closeDb()
process.exit(0)
