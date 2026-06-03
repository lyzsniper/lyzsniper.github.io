/**
 * Seed 2023 历史博客到 content/published/ 并入库
 *
 * 直接走 ingestMarkdownFile，让 chokidar/scheduler 那条逻辑也跑一遍
 * （确保 DB 状态和文件系统一致）
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initDb, closeDb } from './sqlite.js'
import { ingestMarkdownFile } from '../services/ingest.js'
import { logger } from '../lib/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')

const SEEDS = [
  {
    file: path.join(root, 'content/published/2023/09/hello-world/index.md'),
    title: 'Hello World',
  },
  {
    file: path.join(root, 'content/published/2023/09/redis-on-ubuntu/index.md'),
    title: '在 Ubuntu 安装及配置 Redis',
  },
]

async function main() {
  initDb()
  logger.info({ count: SEEDS.length }, 'seed start')

  for (const seed of SEEDS) {
    try {
      const result = await ingestMarkdownFile(seed.file, { source: 'upload' })
      logger.info({ ...result, file: seed.file }, 'seed ok')
    } catch (err) {
      logger.error({ err, file: seed.file }, 'seed failed')
    }
  }

  logger.info('seed done')
  closeDb()
  process.exit(0)
}

main().catch((err) => {
  logger.error({ err }, 'seed fatal')
  process.exit(1)
})
