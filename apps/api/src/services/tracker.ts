/**
 * 页面访问追踪中间件
 *
 * 挂载到 Fastify onResponse hook。记录每次 PV：
 * - 跳过：/api/*、静态资源、HEAD 请求、非 200 状态码
 * - 记录：path / ip / referrer / ua / status_code
 *
 * 注意：React SPA 路由返回 200 但 URL 是前端路由， path 会保留完整路径（含 /blog/:slug）。
 * 本统计表作为"全路径 PV"来源，不过滤 SPA 路由。
 */
import type { FastifyRequest, FastifyReply } from 'fastify'
import { getDb } from '../db/sqlite.js'

const SKIP_PREFIXES = ['/api/', '/assets/']
const SKIP_SUFFIXES = ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js', '.map', '.woff', '.woff2', '.ttf']

function shouldSkip(url: string, method: string, _statusCode: number): boolean {
  if (method === 'HEAD') return true
  for (const p of SKIP_PREFIXES) {
    if (url.startsWith(p)) return true
  }
  const cleanUrl = url.split('?')[0]
  for (const s of SKIP_SUFFIXES) {
    if (cleanUrl.endsWith(s)) return true
  }
  return false
}

/** 从 path 中推断 post slug（仅 /blog/:slug 格式） */
function inferPostSlug(path: string): string | null {
  const m = /^\/(?:en\/)?blog\/([^/]+)\/?$/.exec(path)
  return m ? m[1] : null
}

export function trackPageView(req: FastifyRequest, reply: FastifyReply): void {
  const url = req.url.split('?')[0]
  if (shouldSkip(url, req.method, reply.statusCode)) return

  try {
    const db = getDb()
    const referrer = (req.headers.referer ?? req.headers.referrer ?? null) as string | null
    db.prepare(
      `INSERT INTO page_views (path, post_slug, ip, referrer, user_agent, status_code)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      url,
      inferPostSlug(url),
      req.ip ?? null,
      referrer,
      (req.headers['user-agent'] ?? null) as string | null,
      reply.statusCode,
    )
  } catch {
    // 统计不应影响主流程；静默失败
  }
}
