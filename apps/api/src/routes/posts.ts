import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fs from 'node:fs'
import archiver from 'archiver'
import { PostRepo } from '../db/posts.repo.js'
import { TagRepo } from '../db/tags.repo.js'
import { searchPosts } from '../services/search.js'
import { exportPdf } from '../services/pdf.js'
import { extractToc } from '../lib/markdown.js'
import { requireAdmin } from '../routes/auth.js'

const postRepo = new PostRepo()
const tagRepo = new TagRepo()

export async function postRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/posts — 列表
  app.get<{
    Querystring: {
      page?: string
      tag?: string
      category?: string
      q?: string
      status?: string
    }
  }>('/', async (req) => {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const tag = req.query.tag
    const category = req.query.category
    const q = req.query.q
    const status =
      (req.query.status as
        | 'published'
        | 'draft'
        | 'scheduled'
        | 'archived'
        | undefined) ?? 'published'

    let { rows, total } = postRepo.list({
      page,
      pageSize: 10,
      tag,
      category,
      status,
      q,
    })

    // SQL 没命中且 q 存在，用 FlexSearch 补
    if (q && rows.length === 0) {
      const matched = searchPosts(q, 20)
      const slugs = new Set(matched.map((m) => m.slug))
      const all = postRepo.list({ page: 1, pageSize: 10_000, status })
      rows = all.rows.filter((r) => slugs.has(r.slug))
      total = rows.length
    }

    const pageSize = 10
    return {
      posts: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        summary: r.summary,
        tags: r.tag_names ? r.tag_names.split(',') : [],
        category: r.category,
        date: r.created_at,
        coverImage: r.cover_image,
        readingTime: r.reading_time,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    }
  })

  // GET /api/posts/:slug — 详情
  app.get<{ Params: { slug: string } }>(
    '/:slug',
    async (req: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
      const row = postRepo.findBySlug(req.params.slug)
      if (!row) return reply.code(404).send({ error: 'post not found' })
      postRepo.incrementView(row.slug)
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        summary: row.summary,
        contentMd: row.content_md,
        contentHtml: row.content_html,
        sourcePath: row.source_path,
        tags: row.tag_names ? row.tag_names.split(',') : [],
        category: row.category,
        publishedAt: row.publish_at ?? row.created_at,
        updatedAt: row.updated_at,
        readingTime: row.reading_time,
        coverImage: row.cover_image,
        series: row.series,
        seriesOrder: row.series_order,
        toc: extractToc(row.content_md),
      }
    },
  )

  // GET /api/posts/:slug/related — 相关推荐（标签 + 内容相似度）
  app.get<{ Params: { slug: string } }>(
    '/:slug/related',
    async (req: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
      const row = postRepo.findBySlug(req.params.slug)
      if (!row) return reply.code(404).send({ error: 'post not found' })

      const tags = row.tag_names ? row.tag_names.split(',') : []
      const limit = 5
      const candidates = new Map<string, { slug: string; title: string; score: number }>()

      // 1) 标签匹配：每个共同标签 +0.6
      if (tags.length > 0) {
        const tagMatches = postRepo.findByTags(tags, 20)
        for (const m of tagMatches) {
          if (m.slug === row.slug) continue
          const mTags = m.tag_names ? m.tag_names.split(',') : []
          const overlap = tags.filter((t) => mTags.includes(t)).length
          const score = overlap * 0.6
          candidates.set(m.slug, { slug: m.slug, title: m.title, score })
        }
      }

      // 2) FlexSearch 相似度：标题 + 摘要 文本匹配 +0.4
      const q = `${row.title} ${row.summary ?? ''}`.trim()
      if (q.length > 0) {
        const searchHits = searchPosts(q, 10)
        for (const hit of searchHits) {
          if (hit.slug === row.slug) continue
          const existing = candidates.get(hit.slug)
          if (existing) {
            existing.score += 0.4
          } else {
            candidates.set(hit.slug, { slug: hit.slug, title: hit.title, score: 0.4 })
          }
        }
      }

      // 按 score 降序取 top N
      const sorted = [...candidates.values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

      return { related: sorted }
    },
  )

  // GET /api/posts/:slug/raw — 返回原始 markdown（含 frontmatter）
  app.get<{ Params: { slug: string } }>(
    '/:slug/raw',
    async (req, reply) => {
      const row = postRepo.findBySlug(req.params.slug)
      if (!row) return reply.code(404).send({ error: 'post not found' })
      if (!row.source_path || !fs.existsSync(row.source_path)) {
        // 没有源文件，返回 content_md
        reply.header('Content-Type', 'text/markdown; charset=utf-8')
        return reply.send(row.content_md)
      }
      reply.header('Content-Type', 'text/markdown; charset=utf-8')
      return reply.send(fs.readFileSync(row.source_path, 'utf-8'))
    },
  )

  // GET /api/posts/:slug/download — 下载 .md（仅管理员）
  app.get<{ Params: { slug: string } }>(
    '/:slug/download',
    { preHandler: requireAdmin },
    async (req, reply) => {
      const row = postRepo.findBySlug(req.params.slug)
      if (!row) return reply.code(404).send({ error: 'post not found' })
      if (!row.source_path || !fs.existsSync(row.source_path)) {
        return reply.code(404).send({ error: 'source file missing' })
      }
      reply.header('Content-Type', 'text/markdown; charset=utf-8')
      reply.header(
        'Content-Disposition',
        `attachment; filename="${row.slug}.md"`,
      )
      return reply.send(fs.createReadStream(row.source_path))
    },
  )

  // POST /api/posts/batch-download — 批量 zip（仅管理员）
  app.post<{ Body: { slugs: string[] } }>(
    '/batch-download',
    { preHandler: requireAdmin },
    async (req, reply) => {
      const { slugs } = req.body ?? {}
      if (!Array.isArray(slugs) || slugs.length === 0) {
        return reply.code(400).send({ error: 'slugs required' })
      }
      reply.header('Content-Type', 'application/zip')
      reply.header('Content-Disposition', 'attachment; filename="posts.zip"')
      const archive = archiver('zip', { zlib: { level: 9 } })
      for (const slug of slugs) {
        const row = postRepo.findBySlug(slug)
        if (row?.source_path && fs.existsSync(row.source_path)) {
          archive.file(row.source_path, { name: `${slug}.md` })
        }
      }
      archive.finalize()
      return reply.send(archive)
    },
  )

  // POST /api/posts/:slug/pdf — PDF 导出（占位）
  app.post<{ Params: { slug: string } }>(
    '/:slug/pdf',
    async (req, reply) => {
      const row = postRepo.findBySlug(req.params.slug)
      if (!row) return reply.code(404).send({ error: 'post not found' })
      const pdf = await exportPdf(row.content_html ?? row.content_md)
      reply.header('Content-Type', 'application/pdf')
      reply.header(
        'Content-Disposition',
        `attachment; filename="${row.slug}.pdf"`,
      )
      return reply.send(pdf)
    },
  )

  // POST /api/posts — 创建
  app.post<{
    Body: {
      slug: string
      title: string
      contentMd: string
      tags?: string[]
      summary?: string
      status?: string
      category?: string
    }
  }>('/', async (req, reply) => {
    const { slug, title, contentMd, tags = [], summary, status, category } =
      req.body ?? {}
    if (!slug || !title || !contentMd) {
      return reply.code(400).send({ error: 'slug, title, contentMd required' })
    }
    if (postRepo.findBySlug(slug)) {
      return reply.code(409).send({ error: 'slug exists' })
    }
    const post = postRepo.create({
      slug,
      title,
      summary: summary ?? null,
      content_md: contentMd,
      status: (status as 'draft' | 'published' | undefined) ?? 'published',
      category: category ?? null,
    })
    const tagIds = tags.map((t) => tagRepo.upsertByName(t))
    tagRepo.replaceForPost(post.id, tagIds)
    return post
  })

  // PUT /api/posts/:slug — 更新
  app.put<{
    Params: { slug: string }
    Body: Partial<{
      title: string
      summary: string
      contentMd: string
      status: string
      tags: string[]
      category: string
    }>
  }>('/:slug', async (req, reply) => {
    const row = postRepo.findBySlug(req.params.slug)
    if (!row) return reply.code(404).send({ error: 'post not found' })
    const { tags, category, ...rest } = req.body ?? {}
    const updated = postRepo.update(req.params.slug, {
      title: rest.title,
      summary: rest.summary,
      content_md: rest.contentMd,
      status: rest.status as 'draft' | 'published' | undefined,
      category: category ?? undefined,
    })
    if (tags && updated) {
      const tagIds = tags.map((t) => tagRepo.upsertByName(t))
      tagRepo.replaceForPost(updated.id, tagIds)
    }
    return updated
  })

  // DELETE /api/posts/:slug
  app.delete<{ Params: { slug: string } }>('/:slug', async (req, reply) => {
    const ok = postRepo.delete(req.params.slug)
    if (!ok) return reply.code(404).send({ error: 'post not found' })
    return { ok: true }
  })
}
