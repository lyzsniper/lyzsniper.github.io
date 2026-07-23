const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

export interface PostSummary {
  id: number
  slug: string
  title: string
  summary: string | null
  tags: string[]
  category: string | null
  date: string
  coverImage: string | null
  readingTime: number | null
  viewCount?: number
  featured?: boolean
  series: string | null
  seriesOrder: number | null
}

export interface PostDetail extends PostSummary {
  contentMd: string
  contentHtml: string
  sourcePath?: string | null
  toc: TocItem[]
  publishedAt: string
  updatedAt: string
  viewCount: number
}

export interface Comment {
  id: number
  postId: number
  parentId: number | null
  author: string
  website: string | null
  body: string
  createdAt: string
}

export interface TocItem {
  level: number
  text: string
  slug: string
}

export interface PostListResponse {
  posts: PostSummary[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface StatsOverview {
  totalPv: number
  totalUv: number
  todayPv: number
  todayUv: number
  last7Pv: number
  last7Uv: number
  last30Pv: number
  last30Uv: number
  notFoundTotal: number
}

export interface TrendPoint {
  day: string
  pv: number
  uv: number
}

export interface PostPv {
  slug: string
  pv: number
  title: string
}

export interface ReferrerStat {
  referrer: string
  cnt: number
}

export interface NotFoundStat {
  path: string
  cnt: number
}

export interface HourlyPoint {
  hour: number
  pv: number
}

export interface TagInfo {
  name: string
  slug: string
  count: number
  color: string | null
  description: string | null
}

export interface TagFull extends TagInfo {
  id: number
}

export interface CategoryInfo {
  name: string
  count: number
  depth: number
}

export interface TrackInfo {
  id: number
  title: string
  subtitle: string | null
  duration: number | null
  audioUrl: string | null
  sortOrder: number
}

export interface AlbumInfo {
  slug: string
  title: string
  type: 'album' | 'ep' | 'single'
  description: string | null
  hue: number
  year: number | null
  coverUrl: string | null
  tracks: TrackInfo[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  // DELETE 等请求无 body 时不要带 Content-Type，否则 Fastify 报 FST_ERR_CTP_EMPTY_JSON_BODY
  if (init?.method && init.method !== 'GET' && init.method !== 'HEAD' && !init.body) {
    delete headers['Content-Type']
  }
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers,
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  listPosts: (
    params: { page?: number; tag?: string; category?: string; q?: string; featured?: boolean } = {},
  ) => {
    const sp = new URLSearchParams()
    if (params.page) sp.set('page', String(params.page))
    if (params.tag) sp.set('tag', params.tag)
    if (params.category) sp.set('category', params.category)
    if (params.q) sp.set('q', params.q)
    if (params.featured) sp.set('featured', '1')
    const qs = sp.toString()
    return request<PostListResponse>(`/posts${qs ? `?${qs}` : ''}`)
  },

  getPost: (slug: string) =>
    request<PostDetail>(`/posts/${encodeURIComponent(slug)}`),

  search: (q: string) =>
    request<{ results: PostSummary[] }>(
      `/search?q=${encodeURIComponent(q)}`,
    ),

  getTags: () => request<{ tags: TagInfo[] }>('/tags'),

  getAllTags: () => request<{ tags: TagFull[] }>('/tags/all'),

  updateTag: (
    slug: string,
    meta: { name?: string; color?: string | null; description?: string | null },
  ) =>
    request<TagFull>(`/tags/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: JSON.stringify(meta),
    }),

  getCategories: () =>
    request<{ categories: CategoryInfo[] }>('/categories'),

  downloadUrl: (slug: string) =>
    `${API_BASE}/posts/${encodeURIComponent(slug)}/download`,

  pdfUrl: (slug: string) =>
    `${API_BASE}/posts/${encodeURIComponent(slug)}/pdf`,

  batchDownloadUrl: () => `${API_BASE}/posts/batch-download`,

  getRelated: (slug: string, limit = 5) =>
    request<{ related: { slug: string; title: string; score: number }[] }>(
      `/posts/${encodeURIComponent(slug)}/related?limit=${limit}`,
    ),

  listComments: (postId: number) =>
    request<{ comments: Comment[] }>(`/comments?postId=${postId}`),

  createComment: (data: {
    postId: number
    parentId?: number | null
    author: string
    email?: string
    website?: string
    body: string
  }) =>
    request<Comment>('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  statsOverview: () => request<StatsOverview>('/admin/stats/overview'),
  statsTrend: (days = 30) => request<{ days: number; data: TrendPoint[] }>(`/admin/stats/trend?days=${days}`),
  statsHourly: () => request<{ data: HourlyPoint[] }>('/admin/stats/hourly'),
  statsPosts: (limit = 20) => request<{ data: PostPv[] }>(`/admin/stats/posts?limit=${limit}`),
  statsReferrers: (limit = 10) => request<{ data: ReferrerStat[] }>(`/admin/stats/referrers?limit=${limit}`),
  stats404s: (limit = 20) => request<{ data: NotFoundStat[] }>(`/admin/stats/404s?limit=${limit}`),

  // ===== 音乐 =====
  listAlbums: () => request<{ albums: AlbumInfo[] }>('/music/albums'),
  getAlbum: (slug: string) =>
    request<AlbumInfo>(`/music/albums/${encodeURIComponent(slug)}`),
  createAlbum: (data: {
    title: string
    slug?: string
    type?: AlbumInfo['type']
    description?: string
    hue?: number
    year?: number
  }) =>
    request<AlbumInfo>('/music/albums', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAlbum: (
    slug: string,
    data: Partial<{
      title: string
      type: AlbumInfo['type']
      description: string
      hue: number
      year: number
    }>,
  ) =>
    request<AlbumInfo>(`/music/albums/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAlbum: (slug: string) =>
    request<{ ok: boolean }>(`/music/albums/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    }),
  uploadAlbumCover: (slug: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return fetch(`${API_BASE}/music/albums/${encodeURIComponent(slug)}/cover`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    }).then(async (res) => {
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<AlbumInfo>
    })
  },
  uploadTrack: (
    albumSlug: string,
    payload: { file: File; title: string; subtitle?: string; duration?: number },
  ) => {
    const fd = new FormData()
    fd.append('title', payload.title)
    if (payload.subtitle) fd.append('subtitle', payload.subtitle)
    if (payload.duration) fd.append('duration', String(Math.round(payload.duration)))
    fd.append('file', payload.file)
    return fetch(`${API_BASE}/music/albums/${encodeURIComponent(albumSlug)}/tracks`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    }).then(async (res) => {
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<{ id: number }>
    })
  },
  deleteTrack: (id: number) =>
    request<{ ok: boolean }>(`/music/tracks/${id}`, { method: 'DELETE' }),

  /**
   * 上报一次页面访问。SPA 路由跳转时由 PageTracker 自动调用。
   * 后端 60 秒内同 IP+path+slug 去重；postSlug 给定时同时给 posts.view_count +1。
   * 失败静默吞掉（不阻塞页面渲染）。
   */
  trackPageView: (data: { path: string; postSlug?: string; status?: number; referrer?: string }) => {
    try {
      // 用 keepalive 低优先级请求；不 await，不抛错
      void fetch(`${API_BASE}/track`, {
        method: 'POST',
        credentials: 'include',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: data.path,
          postSlug: data.postSlug,
          status: data.status,
          referrer: data.referrer ?? (typeof document !== 'undefined' ? document.referrer : undefined),
        }),
      }).catch(() => {})
    } catch {
      // 静默
    }
  },
}

export async function batchDownload(slugs: string[]): Promise<void> {
  const res = await fetch(api.batchDownloadUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slugs }),
  })
  if (!res.ok) throw new Error(`Batch download failed: ${res.status}`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `posts-${Date.now()}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
