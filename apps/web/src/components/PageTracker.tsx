/**
 * 全局页面访问追踪器
 *
 * 监听 react-router 的 location.pathname 变化，每次路由跳转调用
 * /api/track 上报 PV。在 dev 模式下这是 page_views 的主要数据来源
 * （SPA 路由不经 Fastify，onResponse hook 收不到）。
 *
 * 设计要点：
 * - 跳过 /api/*（防止 API 调用本身被计入 PV）
 * - 404 状态由 NotFound 组件通过 location.state 显式传入
 * - 后端做 60s 去重，前端不需要额外去重
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '@/lib/api'

function inferSlugFromPath(path: string): string | null {
  // 匹配 /blog/:slug 或 /en/blog/:slug
  const m = /^\/(?:en\/)?blog\/([^/]+)\/?$/.exec(path)
  if (!m) return null
  // 浏览器 location.pathname 保留 percent-encoded 中文 slug，
  // 必须 decode 后才能与 posts.slug（DB 里存的是解码版）匹配
  try {
    return decodeURIComponent(m[1])
  } catch {
    return m[1]
  }
}

export default function PageTracker() {
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname
    if (!path || path.startsWith('/api/')) return

    // NotFound 组件会通过 router state 传 status=404
    const state = location.state as { status?: number } | null
    const status = typeof state?.status === 'number' ? state.status : 200

    const postSlug = inferSlugFromPath(path)

    api.trackPageView({ path, postSlug: postSlug ?? undefined, status })
  }, [location.pathname, location.state])

  return null
}