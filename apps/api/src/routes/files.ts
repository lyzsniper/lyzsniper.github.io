import type { FastifyInstance } from 'fastify'
import fs from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config.js'
import { ingestMarkdownFile } from '../services/ingest.js'
import { logger } from '../lib/logger.js'

export async function fileRoutes(app: FastifyInstance): Promise<void> {
  app.post('/upload', async (req, reply) => {
    const data = await req.file()
    if (!data) return reply.code(400).send({ error: 'file required' })
    if (!data.filename.endsWith('.md')) {
      return reply.code(400).send({ error: 'only .md allowed' })
    }

    const targetPath = path.join(config.inboxDir, data.filename)
    await fs.mkdir(config.inboxDir, { recursive: true })
    const buffer = await data.toBuffer()
    await fs.writeFile(targetPath, buffer, 'utf-8')
    logger.info({ file: targetPath, size: buffer.length }, 'file uploaded')

    try {
      const result = await ingestMarkdownFile(targetPath, { source: 'upload' })
      return { ok: true, ...result }
    } catch (err) {
      return reply.code(500).send({ ok: false, error: String(err) })
    }
  })
}
