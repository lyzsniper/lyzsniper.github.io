import type { FastifyInstance } from 'fastify'
import { config } from '../config.js'
import { logger } from '../lib/logger.js'
import { ingestMarkdownFile } from '../services/ingest.js'

export async function agentRoutes(app: FastifyInstance): Promise<void> {
  // Agent 健康检查
  app.get('/health', async () => ({
    ok: true,
    enabled: config.agentEnabled,
    ingestDir: config.inboxDir,
  }))

  // 推送一篇 markdown（JSON body）
  app.post<{
    Body: {
      filename: string
      content: string // base64 or raw utf-8
      encoding?: 'base64' | 'utf-8'
      slug?: string
    }
  }>('/publish', async (req, reply) => {
    if (!config.agentEnabled) {
      return reply.code(503).send({ error: 'agent endpoint disabled' })
    }

    if (config.agentApiKey) {
      const auth = req.headers['x-agent-key']
      if (auth !== config.agentApiKey) {
        return reply.code(401).send({ error: 'invalid agent key' })
      }
    }

    const { filename, content, encoding = 'utf-8', slug } = req.body ?? {}
    if (!filename || !content) {
      return reply.code(400).send({ error: 'filename and content required' })
    }

    try {
      const decoded =
        encoding === 'base64'
          ? Buffer.from(content, 'base64').toString('utf-8')
          : content

      const result = await ingestMarkdownFile(
        `${config.inboxDir}/${filename}`,
        { source: 'agent', contentOverride: decoded, targetSlug: slug },
      )
      logger.info({ ...result, filename }, 'agent publish ok')
      return { ok: true, ...result }
    } catch (err) {
      logger.error({ err, filename }, 'agent publish failed')
      return reply.code(500).send({ ok: false, error: String(err) })
    }
  })
}
