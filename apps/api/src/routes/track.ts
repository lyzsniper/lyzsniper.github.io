/**
 * 公开访问追踪接口
 *
 * POST /api/track
 * Body: { path: string, postSlug?: string, referrer?: string, status?: number }
 *
 * - 由前端 SPA 在每次路由切换时调用，绕过 Vite dev server（Fastify 收不到 SPA 路由请求）
 * - 写入 page_views 表，供 /api/admin/stats/* 查询
 * - 当 postSlug 提供且对应文章存在时，同时给 posts.view_count +1
 * - status 用于标记 404（404 路径汇总时 WHERE status_code = 404）
 *
 * 注意：
 * - 不鉴权（公开写，但只插表，影响有限）
 * - 不返回数据（前端无需等待）
 * - 同 IP+path+postSlug 在 60 秒内去重，避免双击 / 刷新造成刷量
 */
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { getDb } from '../db/sqlite.js'
import { PostRepo } from '../db/posts.repo.js'

const postRepo = new PostRepo()

const DEDUPE_WINDOW_SECONDS = 60

interface TrackBody {
  path?: unknown
  postSlug?: unknown
  referrer?: unknown
  status?: unknown
}

function inferSlugFromPath(path: string): string | null {
  // 匹配 /blog/:slug 或 /en/blog/:slug
  const m = /^\/(?:en\/)?blog\/([^/]+)\/?$/.exec(path)
  if (!m) return null
  // 前端 location.pathname / Fastify req.url 都是 percent-encoded 的；
  // 必须 decode 才能与 posts.slug（DB 里存的是解码版）匹配
  try {
    return decodeURIComponent(m[1])
  } catch {
    return m[1]
  }
}

export async function trackRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: TrackBody }>('/track', async (req: FastifyRequest<{ Body: TrackBody }>, reply) => {
    const body = req.body ?? {}
    const rawPath = typeof body.path === 'string' ? body.path : ''
    const path = rawPath || '/'
    // 没传 postSlug 就从 path 里推断（前端遗漏兜底）
    const postSlug =
      typeof body.postSlug === 'string' && body.postSlug.length > 0
        ? body.postSlug
        : inferSlugFromPath(path)
    const status =
      typeof body.status === 'number' && Number.isFinite(body.status)
        ? Math.max(100, Math.min(599, Math.floor(body.status)))
        : 200
    const referrer =
      typeof body.referrer === 'string' && body.referrer.length > 0
        ? body.referrer.slice(0, 2048)
        : null

    // 60s 内同 IP + path + postSlug + status 去重
    // status 也参与去重：同一路径若既被 PageTracker（200）又被 NotFound（404）记录，分别保留，
    // 否则 200 的记录会盖掉 404，导致「404 tab」永远为空。
    const sinceIso = new Date(Date.now() - DEDUPE_WINDOW_SECONDS * 1000).toISOString()
    const recent = getDb()
      .prepare(
        `SELECT 1 FROM page_views
          WHERE ip = ?
            AND path = ?
            AND (post_slug IS ? OR post_slug = ?)
            AND status_code = ?
            AND created_at >= ?
          LIMIT 1`,
      )
      .get(req.ip ?? null, path, postSlug, postSlug, status, sinceIso)
    if (recent) {
      return reply.code(204).send()
    }

    try {
      getDb()
        .prepare(
          `INSERT INTO page_views (path, post_slug, ip, referrer, user_agent, status_code)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(
          path,
          postSlug,
          req.ip ?? null,
          referrer,
          typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
          status,
        )

      // 如果是博客文章页，posts.view_count +1（与 page_views 写入原子，但去重失败则不会到这里）
      if (postSlug && postRepo.findBySlug(postSlug)) {
        postRepo.incrementView(postSlug)
      }
    } catch {
      // 追踪失败不影响主流程
    }

    return reply.code(204).send()
  })
}