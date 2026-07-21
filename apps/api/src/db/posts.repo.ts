import type { DatabaseSync } from 'node:sqlite'
import { getDb } from './sqlite.js'
import type {
  PostRow,
  PostSummaryRow,
  PostDetailRow,
  PostListFilter,
  CreatePostInput,
  UpdatePostInput,
} from '../types/post.js'

export class PostRepo {
  // 懒加载 DB — 模块顶层实例化时不会触发 getDb()
  // 确保 initDb() 在第一次实际查询前已执行
  private _db: DatabaseSync | undefined
  private get db(): DatabaseSync {
    if (!this._db) this._db = getDb()
    return this._db
  }

  list(filter: PostListFilter): { rows: PostSummaryRow[]; total: number } {
    const { page = 1, pageSize = 10, tag, category, status = 'published', q, featured } = filter
    const offset = (page - 1) * pageSize

    const where: string[] = ['p.status = ?']
    const params: (string | number)[] = [status]

    if (featured) {
      where.push('p.featured = 1')
    }
    if (tag) {
      where.push(
        'EXISTS (SELECT 1 FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.post_id = p.id AND t.slug = ?)',
      )
      params.push(tag)
    }

    if (category) {
      // category 是层级路径（"技术/AI"），用 LIKE 匹配子树
      where.push('(p.category = ? OR p.category LIKE ?)')
      params.push(category, `${category}/%`)
    }

    if (q) {
      where.push('(p.title LIKE ? OR p.summary LIKE ? OR p.content_md LIKE ?)')
      const like = `%${q}%`
      params.push(like, like, like)
    }

    const whereSql = where.join(' AND ')

    const rows = (this.db
      .prepare(
        `SELECT p.id, p.slug, p.title, p.summary, p.cover_image, p.reading_time, p.created_at, p.category,
                p.featured, p.view_count,
                GROUP_CONCAT(t.name) AS tag_names
         FROM posts p
         LEFT JOIN post_tags pt ON pt.post_id = p.id
         LEFT JOIN tags t ON t.id = pt.tag_id
         WHERE ${whereSql}
         GROUP BY p.id
         ORDER BY p.created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .all(...params, pageSize, offset) as unknown) as PostSummaryRow[]

    const { total } = (this.db
      .prepare(`SELECT COUNT(*) AS total FROM posts p WHERE ${whereSql}`)
      .get(...params) as unknown) as { total: number }

    return { rows, total }
  }

  /**
   * 列出所有用过的分类（带计数）
   */
  listCategories(): { name: string; count: number; depth: number }[] {
    const rows = this.db
      .prepare(
        `SELECT category, COUNT(*) AS count
         FROM posts
         WHERE status = 'published' AND category IS NOT NULL AND category != ''
         GROUP BY category
         ORDER BY category ASC`,
      )
      .all() as { category: string; count: number }[]

    // 展开所有层级（"技术/AI" → 包含 "技术" 和 "技术/AI"）
    const map = new Map<string, number>()
    for (const r of rows) {
      const parts = r.category.split('/')
      for (let i = 1; i <= parts.length; i++) {
        const key = parts.slice(0, i).join('/')
        map.set(key, (map.get(key) ?? 0) + r.count)
      }
    }

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count, depth: name.split('/').length }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  findByTags(tags: string[], limit: number): PostSummaryRow[] {
    if (tags.length === 0) return []
    const placeholders = tags.map(() => '?').join(', ')
    return (this.db
      .prepare(
        `SELECT p.id, p.slug, p.title, p.summary, p.cover_image, p.reading_time, p.created_at, p.category,
                p.featured, p.view_count,
                GROUP_CONCAT(t.name) AS tag_names
         FROM posts p
         JOIN post_tags pt ON pt.post_id = p.id
         JOIN tags t ON t.id = pt.tag_id
         WHERE p.status = 'published'
           AND t.name IN (${placeholders})
         GROUP BY p.id
         ORDER BY p.created_at DESC
         LIMIT ?`,
      )
      .all(...tags, limit) as unknown) as PostSummaryRow[]
  }

  findBySlug(slug: string): PostDetailRow | null {
    return ((this.db
      .prepare(
        `SELECT p.*, GROUP_CONCAT(t.name) AS tag_names
         FROM posts p
         LEFT JOIN post_tags pt ON pt.post_id = p.id
         LEFT JOIN tags t ON t.id = pt.tag_id
         WHERE p.slug = ?
         GROUP BY p.id`,
      )
      .get(slug) as unknown) as PostDetailRow | undefined) ?? null
  }

  findById(id: number): PostRow | null {
    return ((this.db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as unknown) as
      | PostRow
      | undefined) ?? null
  }

  create(input: CreatePostInput): PostRow {
    const info = this.db
      .prepare(
        `INSERT INTO posts (slug, title, summary, content_md, source_path, status, publish_at, reading_time, cover_image, category, series, series_order, featured)
         VALUES (@slug, @title, @summary, @content_md, @source_path, @status, @publish_at, @reading_time, @cover_image, @category, @series, @series_order, @featured)`,
      )
      .run({
        slug: input.slug,
        title: input.title,
        summary: input.summary ?? null,
        content_md: input.content_md,
        source_path: input.source_path ?? null,
        status: input.status ?? 'published',
        publish_at: input.publish_at ?? null,
        reading_time: input.reading_time ?? null,
        cover_image: input.cover_image ?? null,
        category: input.category ?? null,
        series: input.series ?? null,
        series_order: input.series_order ?? null,
        featured: input.featured ?? 0,
      } as Record<string, string | number | null>) as unknown as { lastInsertRowid: number | bigint }
    return this.findById(Number(info.lastInsertRowid))!
  }

  update(slug: string, input: UpdatePostInput): PostRow | null {
    const fields: string[] = []
    const params: Record<string, unknown> = { slug }
    for (const [k, v] of Object.entries(input)) {
      if (v !== undefined) {
        fields.push(`${k} = @${k}`)
        params[k] = v
      }
    }
    if (fields.length === 0) return this.findBySlug(slug)

    this.db
      .prepare(
        `UPDATE posts SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE slug = @slug`,
      )
      .run(params as Record<string, string | number | null>)
    return this.findBySlug(slug)
  }

  delete(slug: string): boolean {
    const info = this.db.prepare('DELETE FROM posts WHERE slug = ?').run(slug) as { changes: number }
    return info.changes > 0
  }

  incrementView(slug: string): void {
    this.db
      .prepare('UPDATE posts SET view_count = view_count + 1 WHERE slug = ?')
      .run(slug)
  }
}
