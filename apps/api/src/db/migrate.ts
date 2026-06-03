import { initDb, closeDb } from './sqlite.js'
import { logger } from '../lib/logger.js'

initDb()
logger.info('✅ 数据库迁移完成（init 已包含建表）')
closeDb()
process.exit(0)
