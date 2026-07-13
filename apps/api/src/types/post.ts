export interface PostRow {
  id: number
  slug: string
  title: string
  summary: string | null
  content_md: string
  content_html: string | null
  source_path: string | null
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  publish_at: string | null
  created_at: string
  updated_at: string
  reading_time: number | null
  cover_image: string | null
  view_count: number
  category: string | null
  series: string | null
  series_order: number | null
}

export interface PostSummaryRow {
  id: number
  slug: string
  title: string
  summary: string | null
  cover_image: string | null
  reading_time: number | null
  created_at: string
  tag_names: string | null
  category: string | null
  series: string | null
  series_order: number | null
}

export interface PostDetailRow extends PostRow {
  tag_names: string | null
}

export interface PostListFilter {
  page?: number
  pageSize?: number
  tag?: string
  category?: string
  status?: PostRow['status']
  q?: string
}

export interface CreatePostInput {
  slug: string
  title: string
  summary?: string | null
  content_md: string
  content_html?: string | null
  source_path?: string | null
  status?: PostRow['status']
  publish_at?: string | null
  reading_time?: number | null
  cover_image?: string | null
  category?: string | null
  series?: string | null
  series_order?: number | null
}

export interface UpdatePostInput {
  title?: string
  summary?: string | null
  content_md?: string
  content_html?: string | null
  source_path?: string | null
  status?: PostRow['status']
  publish_at?: string | null
  reading_time?: number | null
  cover_image?: string | null
  category?: string | null
  series?: string | null
  series_order?: number | null
}
