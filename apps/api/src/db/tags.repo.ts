import type Database from 'better-sqlite3'
import { getDb } from './sqlite.js'

export class TagRepo {
  private _db: Database.Database | undefined
  private get db(): Database.Database {
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
    const params: Record<string, unknown> = { slug }
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
    this.db
      .prepare(`UPDATE tags SET ${fields.join(', ')} WHERE slug = @slug`)
      .run(params)
    return this.db
      .prepare('SELECT name, slug, color, description FROM tags WHERE slug = ?')
      .get(slug) as { name: string; slug: string; color: string | null; description: string | null } | null
  }

  upsertByName(name: string): number {
    const slug = this.toSlug(name)
    const existing = this.db
      .prepare('SELECT id FROM tags WHERE slug = ?')
      .get(slug) as { id: number } | undefined
    if (existing) return existing.id
    const info = this.db
      .prepare('INSERT INTO tags (name, slug) VALUES (?, ?)')
      .run(name, slug)
    return Number(info.lastInsertRowid)
  }

  attach(postId: number, tagIds: number[]): void {
    const stmt = this.db.prepare(
      'INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)',
    )
    const tx = this.db.transaction((ids: number[]) => {
      for (const id of ids) stmt.run(postId, id)
    })
    tx(tagIds)
  }

  replaceForPost(postId: number, tagIds: number[]): void {
    const tx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM post_tags WHERE post_id = ?').run(postId)
      this.attach(postId, tagIds)
    })
    tx()
  }

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-一-龥]/g, '')
  }
}
