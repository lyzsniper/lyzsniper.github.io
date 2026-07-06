import type { FastifyInstance } from 'fastify'
import fs from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config.js'
import { logger } from '../lib/logger.js'
import { ingestMarkdownFile } from '../services/ingest.js'

export async function inboxRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/inbox — 列出待收录的 .md
  app.get('/', async () => {
    try {
      await fs.mkdir(config.inboxDir, { recursive: true })
      const entries = await fs.readdir(config.inboxDir, { withFileTypes: true })
      const files = await Promise.all(
        entries
          .filter((e) => e.isFile() && e.name.endsWith('.md'))
          .map(async (e) => {
            const full = path.join(config.inboxDir, e.name)
            const stat = await fs.stat(full)
            return {
              name: e.name,
              size: stat.size,
              modified: stat.mtime.toISOString(),
            }
          }),
      )
      return { files }
    } catch (err) {
      logger.error({ err }, 'inbox list failed')
      return { files: [], error: String(err) }
    }
  })

  // POST /api/inbox/ingest — 手动触发单文件收录（支持覆盖标签）
  app.post<{ Body: { filename: string; tags?: string[] } }>(
    '/ingest',
    async (req, reply) => {
      const { filename, tags } = req.body ?? {}
      if (!filename || filename.includes('/') || filename.includes('..')) {
        return reply.code(400).send({ error: 'invalid filename' })
      }
      const filePath = path.join(config.inboxDir, filename)
      try {
        await fs.access(filePath)
      } catch {
        return reply.code(404).send({ error: 'file not found in inbox' })
      }
      try {
        // 如果提供了标签，先重写 frontmatter
        if (tags && tags.length > 0) {
          const raw = await fs.readFile(filePath, 'utf-8')
          const { data, content } = matter(raw)
          data.tags = tags
          const updated = matter.stringify(content, data)
          await fs.writeFile(filePath, updated, 'utf-8')
        }
        const result = await ingestMarkdownFile(filePath, { source: 'inbox' })
        return { ok: true, ...result }
      } catch (err) {
        return reply.code(500).send({ ok: false, error: String(err) })
      }
    },
  )
}
