import type { FastifyInstance } from 'fastify'
import { TagRepo } from '../db/tags.repo.js'

const tagRepo = new TagRepo()

export async function tagRoutes(app: FastifyInstance): Promise<void> {
  // 列出所有有文章的 tag
  app.get('/', async () => {
    return { tags: tagRepo.list() }
  })

  // 列出所有 tag（管理用，含 count=0）
  app.get('/all', async () => {
    return { tags: tagRepo.listAll() }
  })

  // 更新 tag 元数据
  app.put<{
    Params: { slug: string }
    Body: { name?: string; color?: string | null; description?: string | null }
  }>('/:slug', async (req, reply) => {
    const updated = tagRepo.updateMeta(req.params.slug, req.body ?? {})
    if (!updated) return reply.code(404).send({ error: 'tag not found or no fields' })
    return updated
  })
}
