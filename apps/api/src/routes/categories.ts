import type { FastifyInstance } from 'fastify'
import { PostRepo } from '../db/posts.repo.js'

const postRepo = new PostRepo()

export async function categoryRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/categories — 列出所有用过的分类（含层级展开）
  app.get('/', async () => {
    return { categories: postRepo.listCategories() }
  })
}
