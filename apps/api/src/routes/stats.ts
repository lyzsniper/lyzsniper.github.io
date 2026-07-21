/**
 * 统计后台 API
 *
 * GET  /api/admin/stats/overview   — 总览（PV/UV/今日/近7日/近30日/404总数）
 * GET  /api/admin/stats/trend      — 每日 PV/UV 时序（默认 30 天）
 * GET  /api/admin/stats/pattern    — 每小时热度分布（0-23 时）
 * GET  /api/admin/stats/posts      — 最受欢迎文章 Top N（与 posts view_count 联动）
 * GET  /api/admin/stats/referrers   — 访问来源 Top N
 * GET  /api/admin/stats/404s       — 404 路径 Top N
 * POST /api/track                  — 公开访问追踪（前端 SPA 路由跳转时调用，写入 page_views）
 *
 * /api/admin/stats/* 鉴权：全部 requireAdmin（挂载到 admin 前缀，server.ts 的 onRequest 会校验）。
 * /api/track       无鉴权：公开访问追踪接口，仅写入数据库，不返回敏感数据。
 *
 * 性能注意：所有聚合跑全表扫描。生产建议：
 *   - page_views 表按月分表或定期归档
 *   - overview 用 Redis 缓存 60s
 *   当前实现默认全库扫描（博客量级够用）；如表超 100 万行可加日期范围过滤。
 */
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { getDb } from '../db/sqlite.js'

function db() {
  return getDb()
}

/** 按日期分组的 PV/UV 时序 */
function trendData(days: number) {
  const rows = db()
    .prepare(
      `SELECT date(created_at)                AS day,
              COUNT(*)                        AS pv,
              COUNT(DISTINCT ip)              AS uv
         FROM page_views
        WHERE created_at >= datetime('now', ?)
        GROUP BY date(created_at)
        ORDER BY day ASC`,
    )
    .all(`-${days} days`) as { day: string; pv: number; uv: number }[]
  return rows
}

function overview() {
  const total = db()
    .prepare('SELECT COUNT(*) AS pv, COUNT(DISTINCT ip) AS uv FROM page_views')
    .get() as { pv: number; uv: number }

  const today = db()
    .prepare(
      `SELECT COUNT(*) AS pv, COUNT(DISTINCT ip) AS uv
         FROM page_views
        WHERE date(created_at) = date('now')`,
    )
    .get() as { pv: number; uv: number }

  const last7 = db()
    .prepare(
      `SELECT COUNT(*) AS pv, COUNT(DISTINCT ip) AS uv
         FROM page_views
        WHERE created_at >= datetime('now', '-7 days')`,
    )
    .get() as { pv: number; uv: number }

  const last30 = db()
    .prepare(
      `SELECT COUNT(*) AS pv, COUNT(DISTINCT ip) AS uv
         FROM page_views
        WHERE created_at >= datetime('now', '-30 days')`,
    )
    .get() as { pv: number; uv: number }

  const notFound = db()
    .prepare('SELECT COUNT(*) AS cnt FROM page_views WHERE status_code = 404')
    .get() as { cnt: number }

  return {
    totalPv: total.pv,
    totalUv: total.uv,
    todayPv: today.pv,
    todayUv: today.uv,
    last7Pv: last7.pv,
    last7Uv: last7.uv,
    last30Pv: last30.pv,
    last30Uv: last30.uv,
    notFoundTotal: notFound.cnt,
  }
}

function hourlyPattern() {
  return db()
    .prepare(
      `SELECT CAST(strftime('%H', created_at) AS INTEGER) AS hour,
              COUNT(*)                                   AS pv
         FROM page_views
        GROUP BY strftime('%H', created_at)
        ORDER BY hour ASC`,
    )
    .all() as { hour: number; pv: number }[]
}

function topPosts(limit: number) {
  return db()
    .prepare(
      `SELECT post_slug        AS slug,
              COUNT(*)          AS pv
         FROM page_views
        WHERE post_slug IS NOT NULL
        GROUP BY post_slug
        ORDER BY pv DESC
        LIMIT ?`,
    )
    .all(limit) as { slug: string; pv: number }[]
}

function topReferrers(limit: number) {
  return db()
    .prepare(
      `SELECT CASE
                WHEN referrer IS NULL OR referrer = '' THEN '(direct)'
                ELSE substr(referrer, 1, 80)
              END              AS referrer,
              COUNT(*)          AS cnt
         FROM page_views
        GROUP BY CASE
                   WHEN referrer IS NULL OR referrer = '' THEN '(direct)'
                   ELSE substr(referrer, 1, 80)
                 END
        ORDER BY cnt DESC
        LIMIT ?`,
    )
    .all(limit) as { referrer: string; cnt: number }[]
}

function top404s(limit: number) {
  return db()
    .prepare(
      `SELECT path,
              COUNT(*) AS cnt
         FROM page_views
        WHERE status_code = 404
        GROUP BY path
        ORDER BY cnt DESC
        LIMIT ?`,
    )
    .all(limit) as { path: string; cnt: number }[]
}

export async function statsRoutes(app: FastifyInstance): Promise<void> {
  // overview
  app.get('/overview', async () => overview())

  // trend
  app.get<{ Querystring: { days?: string } }>('/trend', async (req: FastifyRequest<{ Querystring: { days?: string } }>) => {
    const days = Math.min(365, Math.max(1, Number(req.query.days ?? 30)))
    return { days, data: trendData(days) }
  })

  // hourly pattern
  app.get('/hourly', async () => ({ data: hourlyPattern() }))

  // top posts
  app.get<{ Querystring: { limit?: string } }>('/posts', async (req: FastifyRequest<{ Querystring: { limit?: string } }>) => {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 10)))
    const rows = topPosts(limit)
    // 关联文章标题。page_views.post_slug 历史数据可能是 percent-encoded 的，
    // 这里双重匹配（先按原值，再按 decode 后的值），避免 URL 编码不一致导致 title 查不到
    const lookupTitle = db().prepare('SELECT title FROM posts WHERE slug = ?')
    const withTitles = rows.map((r) => {
      const decoded = (() => {
        try { return decodeURIComponent(r.slug) } catch { return r.slug }
      })()
      const hit =
        (lookupTitle.get(r.slug) as { title: string } | undefined) ??
        (lookupTitle.get(decoded) as { title: string } | undefined)
      return { ...r, title: hit?.title ?? decoded }
    })
    return { data: withTitles }
  })

  // referrers
  app.get<{ Querystring: { limit?: string } }>('/referrers', async (req: FastifyRequest<{ Querystring: { limit?: string } }>) => {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 10)))
    return { data: topReferrers(limit) }
  })

  // 404s
  app.get<{ Querystring: { limit?: string } }>('/404s', async (req: FastifyRequest<{ Querystring: { limit?: string } }>) => {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)))
    return { data: top404s(limit) }
  })
}
