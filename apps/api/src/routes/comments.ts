import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { listComments, createComment, CommentError } from '../services/comments.js'

interface ListQuery {
  postId: string
}

interface CreateBody {
  postId: number
  parentId?: number | null
  author: string
  email?: string
  website?: string
  body: string
}

export async function commentRoutes(app: FastifyInstance) {
  // GET /api/comments?postId=123 — 获取已审核评论
  app.get<{ Querystring: ListQuery }>(
    '/',
    async (req: FastifyRequest<{ Querystring: ListQuery }>, reply: FastifyReply) => {
      const postId = Number(req.query.postId)
      if (!postId) return reply.code(400).send({ error: 'postId required' })
      return { comments: listComments(postId) }
    },
  )

  // POST /api/comments — 创建评论
  app.post<{ Body: CreateBody }>(
    '/',
    async (req: FastifyRequest<{ Body: CreateBody }>, reply: FastifyReply) => {
      const { postId, parentId, author, email, website, body } = req.body ?? {}
      if (!postId || !author || !body) {
        return reply.code(400).send({ error: 'postId, author, body required' })
      }
      try {
        const comment = createComment({
          postId,
          parentId: parentId ?? null,
          author,
          email,
          website,
          body,
          ip: req.ip,
          userAgent: req.headers['user-agent'] ?? null,
        })
        return reply.code(201).send(comment)
      } catch (err) {
        if (err instanceof CommentError) {
          const status =
            err.code === 'not_found' ? 404 : err.code === 'throttled' ? 429 : 400
          return reply.code(status).send({ error: err.message, code: err.code })
        }
        throw err
      }
    },
  )
}
