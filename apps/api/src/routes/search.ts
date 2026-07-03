import type { FastifyInstance } from 'fastify'
import { searchPosts } from '../services/search.js'

export async function searchRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { q?: string } }>('/', async (req) => {
    const q = (req.query.q ?? '').trim()
    if (!q) return { results: [] }
    return { results: searchPosts(q, 20) }
  })
}
