import type { DatabaseSync } from 'node:sqlite'
import { getDb } from './sqlite.js'

/** name/slug 已被另一个 tag 占用 — 由路由层转成 409 */
export class TagConflictError extends Error {
  constructor(public readonly field: 'name' | 'slug', public readonly value: string) {
    super(`tag with ${field} "${value}" already exists`)
    this.name = 'TagConflictError'
  }
}

export class TagRepo {
  private _db: DatabaseSync | undefined
  private get db(): DatabaseSync {
    if (!this._db) this._db = getDb()
    return this._db
  }

  list(): { name: string; slug: string; count: number; color: string | null; description: string | null }[] {
    return this.db
      .prepare(
        `SELECT t.name, t.slug, t.color, t.description, COUNT(pt.post_id) AS count
         FROM tags t
         LEFT JOIN post_tags pt ON pt.tag_id = t.id
         LEFT JOIN posts p ON p.id = pt.post_id AND p.status = 'published'
         GROUP BY t.id
         HAVING count > 0
         ORDER BY count DESC`,
      )
      .all() as { name: string; slug: string; count: number; color: string | null; description: string | null }[]
  }

  /** 列出所有 tag（含 count=0 的，用于管理） */
  listAll(): { id: number; name: string; slug: string; color: string | null; description: string | null; count: number }[] {
    return this.db
      .prepare(
        `SELECT t.id, t.name, t.slug, t.color, t.description,
                (SELECT COUNT(*) FROM post_tags pt JOIN posts p ON p.id = pt.post_id WHERE pt.tag_id = t.id AND p.status = 'published') AS count
         FROM tags t
         ORDER BY count DESC, t.name ASC`,
      )
      .all() as { id: number; name: string; slug: string; color: string | null; description: string | null; count: number }[]
  }

  /** 更新 tag 元数据 */
  updateMeta(
    slug: string,
    meta: { name?: string; color?: string | null; description?: string | null },
  ): { name: string; slug: string; color: string | null; description: string | null } | null {
    const fields: string[] = []
    const params: Record<string, string | null> = { slug }
    if (meta.name !== undefined) {
      fields.push('name = @name')
      params.name = meta.name
    }
    if (meta.color !== undefined) {
      fields.push('color = @color')
      params.color = meta.color
    }
    if (meta.description !== undefined) {
      fields.push('description = @description')
      params.description = meta.description
    }
    if (fields.length === 0) return null

    // 提前检查 name 唯一性，给出友好错误而不是等 SQLite 抛 UNIQUE
    if (meta.name !== undefined) {
      const conflict = this.db
        .prepare('SELECT slug FROM tags WHERE name = ? AND slug != ?')
        .get(meta.name, slug) as { slug: string } | undefined
      if (conflict) throw new TagConflictError('name', meta.name)
    }

    try {
      this.db
        .prepare(`UPDATE tags SET ${fields.join(', ')} WHERE slug = @slug`)
        .run(params as Record<string, string | number | null>)
    } catch (e) {
      // 兜底：万一预检查和写入之间被并发绕过，仍捕获 SQLite 原始错误
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('UNIQUE constraint failed: tags.name')) {
        throw new TagConflictError('name', meta.name ?? '')
      }
      throw e
    }

    return this.db
      .prepare('SELECT name, slug, color, description FROM tags WHERE slug = ?')
      .get(slug) as { name: string; slug: string; color: string | null; description: string | null } | null
  }

  /**
   * 给文章附加标签时调用：保证幂等。
   * - name 已被另一个 tag 占用 → 直接复用那个 tag（不报错）
   * - slug 已被另一个 tag 占用 → 直接复用那个 tag（不报错）
   * - 都不占 → INSERT；并发竞态兜底 UNIQUE 重新查
   */
  upsertByName(name: string): number {
    const trimmed = (name ?? '').trim()
    if (!trimmed) throw new Error('tag name cannot be empty')
    const slug = this.toSlug(trimmed)

    // 1) 按 name 查（解决 name 相同但 slug 不同的情况：直接复用）
    const byName = this.db
      .prepare('SELECT id FROM tags WHERE name = ?')
      .get(trimmed) as { id: number } | undefined
    if (byName) return byName.id

    // 2) 按 slug 查（大小写、空格变体都可命中）
    const bySlug = this.db
      .prepare('SELECT id FROM tags WHERE slug = ?')
      .get(slug) as { id: number } | undefined
    if (bySlug) return bySlug.id

    // 3) INSERT；并发场景下别人刚插过 → 兜底重查
    try {
      const info = this.db
        .prepare('INSERT INTO tags (name, slug) VALUES (?, ?)')
        .run(trimmed, slug)
      return Number(info.lastInsertRowid)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('UNIQUE constraint failed')) {
        const again = this.db
          .prepare('SELECT id FROM tags WHERE name = ? OR slug = ?')
          .get(trimmed, slug) as { id: number } | undefined
        if (again) return again.id
      }
      throw e
    }
  }

  attach(postId: number, tagIds: number[]): void {
    const stmt = this.db.prepare(
      'INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)',
    )
    for (const id of tagIds) stmt.run(postId, id)
  }

  replaceForPost(postId: number, tagIds: number[]): void {
    // node:sqlite (Node 24) 没有 transaction() 方法，直接顺序执行
    this.db.prepare('DELETE FROM post_tags WHERE post_id = ?').run(postId)
    this.attach(postId, tagIds)
  }

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-一-龥]/g, '')
  }
}
