import FlexSearch from 'flexsearch'
import { PostRepo } from '../db/posts.repo.js'
import { logger } from '../lib/logger.js'

interface PostIndexItem {
  id: number
  slug: string
  title: string
  summary: string
  content: string
  date: string
}

const index = new FlexSearch.Document<PostIndexItem>({
  document: {
    id: 'id',
    index: ['title', 'summary', 'content'],
    store: ['id', 'slug', 'title', 'summary', 'date'],
  },
  tokenize: 'forward',
})

export function startSearchIndex(): void {
  void rebuildIndex()
}

export async function rebuildIndex(): Promise<void> {
  try {
    const repo = new PostRepo()
    const { rows } = repo.list({
      page: 1,
      pageSize: 10_000,
      status: 'published',
    })
    for (const row of rows) {
      const detail = repo.findBySlug(row.slug)
      if (!detail) continue
      index.add({
        id: row.id,
        slug: row.slug,
        title: row.title,
        summary: row.summary ?? '',
        content: detail.content_md.slice(0, 5000),
        date: row.created_at,
      })
    }
    logger.info({ count: rows.length }, 'search index built')
  } catch (err) {
    logger.error({ err }, 'search index build failed')
  }
}

export function addToIndex(item: PostIndexItem): void {
  index.add(item)
}

export function searchPosts(
  q: string,
  limit = 20,
): { id: number; slug: string; title: string; summary: string; date: string }[] {
  const results = index.search(q, { limit, enrich: true }) as Array<{
    field: string
    result: Array<{ id: string; doc: PostIndexItem }>
  }>

  const seen = new Set<number>()
  const merged: PostIndexItem[] = []
  for (const r of results) {
    for (const item of r.result) {
      const numericId = Number(item.id)
      if (seen.has(numericId)) continue
      seen.add(numericId)
      merged.push(item.doc)
      if (merged.length >= limit) break
    }
    if (merged.length >= limit) break
  }

  return merged.map((m) => ({
    id: m.id,
    slug: m.slug,
    title: m.title,
    summary: m.summary,
    date: m.date,
  }))
}
