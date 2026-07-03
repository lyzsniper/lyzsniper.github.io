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
}

export interface PostDetail extends PostSummary {
  contentMd: string
  contentHtml: string
  toc: TocItem[]
  publishedAt: string
  updatedAt: string
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
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
    params: { page?: number; tag?: string; category?: string; q?: string } = {},
  ) => {
    const sp = new URLSearchParams()
    if (params.page) sp.set('page', String(params.page))
    if (params.tag) sp.set('tag', params.tag)
    if (params.category) sp.set('category', params.category)
    if (params.q) sp.set('q', params.q)
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
