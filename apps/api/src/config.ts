import { config as loadDotenv } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// apps/api/src/config.ts → src → api → apps → project root
const root = path.resolve(__dirname, '../../..')

// 加载根 .env（共享配置），再加载本地 .env
loadDotenv({ path: path.resolve(root, '.env') })
loadDotenv({ path: path.resolve(__dirname, '../.env'), override: false })

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? '0.0.0.0',
  logLevel: process.env.LOG_LEVEL ?? 'info',

  contentRoot: path.resolve(root, process.env.CONTENT_ROOT ?? './content'),
  inboxDir: path.resolve(root, process.env.INBOX_DIR ?? './content/inbox'),
  draftsDir: path.resolve(root, process.env.DRAFTS_DIR ?? './content/drafts'),
  publishedDir: path.resolve(
    root,
    process.env.PUBLISHED_DIR ?? './content/published',
  ),

  dbPath: path.resolve(root, process.env.DB_PATH ?? './data/blog.db'),
  uploadsDir: path.resolve(root, process.env.UPLOADS_DIR ?? './data/uploads'),

  watchInbox: (process.env.WATCH_INBOX ?? 'true') === 'true',
  cronPattern: process.env.CRON_PATTERN ?? '0 * * * *',

  pdfEnabled: (process.env.PDF_ENABLED ?? 'true') === 'true',
  puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,

  agentEnabled: (process.env.AGENT_ENABLED ?? 'true') === 'true',
  agentApiKey: process.env.AGENT_API_KEY || undefined,

  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  siteUrl: process.env.SITE_URL ?? 'http://localhost:4000',
} as const

export type AppConfig = typeof config

