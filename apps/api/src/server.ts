import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import { config } from './config.js'
import { initDb, closeDb } from './db/sqlite.js'
import { healthRoutes } from './routes/healthz.js'
import { authRoutes, requireAdmin } from './routes/auth.js'
import { postRoutes } from './routes/posts.js'
import { tagRoutes } from './routes/tags.js'
import { searchRoutes } from './routes/search.js'
import { fileRoutes } from './routes/files.js'
import { agentRoutes } from './routes/agent.js'
import { feedRoutes } from './routes/feed.js'
import { commentRoutes } from './routes/comments.js'
import { statsRoutes } from './routes/stats.js'
import { seoRoutes } from './routes/seo.js'
import { trackPageView } from './services/tracker.js'
import { inboxRoutes } from './routes/inbox.js'
import { categoryRoutes } from './routes/categories.js'
import { startInboxWatcher, stopInboxWatcher } from './services/inbox-watcher.js'
import { startScheduler, stopScheduler } from './services/scheduler.js'
import { startSearchIndex } from './services/search.js'

async function buildServer() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  })

  // CORS
  await app.register(cors, {
    origin: config.corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  })

  // Cookie
  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET ?? 'dev-cookie-secret-change-me',
  })

  // Multipart (file upload)
  await app.register(multipart, {
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  })

  // 初始化 DB
  initDb()

  // 注册路由
  await app.register(healthRoutes, { prefix: '/api' })
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(postRoutes, { prefix: '/api/posts' })
  await app.register(tagRoutes, { prefix: '/api/tags' })
  await app.register(searchRoutes, { prefix: '/api/search' })
  await app.register(fileRoutes, { prefix: '/api/files' })
  await app.register(agentRoutes, { prefix: '/api/agent' })
  await app.register(inboxRoutes, { prefix: '/api/inbox' })
  await app.register(categoryRoutes, { prefix: '/api/categories' })
  await app.register(feedRoutes, { prefix: '/api' })
  await app.register(commentRoutes, { prefix: '/api/comments' })
  await app.register(statsRoutes, { prefix: '/api/admin/stats' })
  await app.register(seoRoutes, { prefix: '' })

  // 追踪页面访问（onResponse hook，所有已匹配路由）
  app.addHook('onResponse', (req, reply, done) => {
    trackPageView(req, reply)
    done()
  })

  // 给所有需要鉴权的 admin 路由加 onRequest 钩子
  // 匹配写到 /api/posts, /api/tags, /api/files, /api/inbox 的请求
  const writeMethods = new Set(['POST', 'PUT', 'DELETE', 'PATCH'])
  const adminPrefixes = ['/api/posts', '/api/tags', '/api/files', '/api/inbox', '/api/admin']
  app.addHook('onRequest', async (req, reply) => {
    if (!writeMethods.has(req.method)) return
    const url = req.url.split('?')[0]
    const isAdminRoute = adminPrefixes.some((p) => url === p || url.startsWith(p + '/'))
    if (!isAdminRoute) return
    await requireAdmin(req, reply)
  })

  // 启动后台服务
  startSearchIndex()
  if (config.watchInbox) {
    startInboxWatcher()
  }
  startScheduler()

  // 优雅关闭
  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down...`)
    try {
      stopInboxWatcher()
      stopScheduler()
      await app.close()
      closeDb()
      process.exit(0)
    } catch (err) {
      app.log.error(err)
      process.exit(1)
    }
  }
  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  return app
}

async function main() {
  const app = await buildServer()
  try {
    await app.listen({ port: config.port, host: config.host })
    app.log.info(`🚀 Server ready at http://${config.host}:${config.port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
