import type { DatabaseSync } from 'node:sqlite'
import { getDb } from './sqlite.js'

export interface AlbumRow {
  id: number
  slug: string
  title: string
  type: 'album' | 'ep' | 'single'
  description: string | null
  hue: number
  year: number | null
  cover_path: string | null
  created_at: string
}

export interface TrackRow {
  id: number
  album_id: number
  title: string
  subtitle: string | null
  duration: number | null
  file_path: string | null
  sort_order: number
  created_at: string
}

export interface AlbumInput {
  slug: string
  title: string
  type?: AlbumRow['type']
  description?: string | null
  hue?: number
  year?: number | null
  cover_path?: string | null
}

export class MusicRepo {
  private _db: DatabaseSync | undefined
  private get db(): DatabaseSync {
    if (!this._db) this._db = getDb()
    return this._db
  }

  listAlbums(): AlbumRow[] {
    return this.db
      .prepare('SELECT * FROM albums ORDER BY year DESC, id DESC')
      .all() as unknown as AlbumRow[]
  }

  findAlbumBySlug(slug: string): AlbumRow | null {
    return (
      (this.db.prepare('SELECT * FROM albums WHERE slug = ?').get(slug) as unknown as
        | AlbumRow
        | undefined) ?? null
    )
  }

  createAlbum(input: AlbumInput): AlbumRow {
    const info = this.db
      .prepare(
        `INSERT INTO albums (slug, title, type, description, hue, year)
         VALUES (@slug, @title, @type, @description, @hue, @year)`,
      )
      .run({
        slug: input.slug,
        title: input.title,
        type: input.type ?? 'album',
        description: input.description ?? null,
        hue: input.hue ?? 242,
        year: input.year ?? null,
      } as Record<string, string | number | null>) as unknown as {
      lastInsertRowid: number | bigint
    }
    return this.db
      .prepare('SELECT * FROM albums WHERE id = ?')
      .get(Number(info.lastInsertRowid)) as unknown as AlbumRow
  }

  updateAlbum(slug: string, input: Partial<AlbumInput>): AlbumRow | null {
    const fields: string[] = []
    const params: Record<string, string | number | null> = { slug }
    for (const [k, v] of Object.entries(input)) {
      if (v !== undefined && k !== 'slug') {
        fields.push(`${k} = @${k}`)
        params[k] = v as string | number | null
      }
    }
    if (fields.length > 0) {
      this.db
        .prepare(`UPDATE albums SET ${fields.join(', ')} WHERE slug = @slug`)
        .run(params)
    }
    return this.findAlbumBySlug(slug)
  }

  deleteAlbum(slug: string): boolean {
    const info = this.db.prepare('DELETE FROM albums WHERE slug = ?').run(slug) as {
      changes: number
    }
    return info.changes > 0
  }

  listTracks(albumId: number): TrackRow[] {
    return this.db
      .prepare('SELECT * FROM tracks WHERE album_id = ? ORDER BY sort_order, id')
      .all(albumId) as unknown as TrackRow[]
  }

  createTrack(input: {
    album_id: number
    title: string
    subtitle?: string | null
    duration?: number | null
    file_path?: string | null
    sort_order?: number
  }): TrackRow {
    const info = this.db
      .prepare(
        `INSERT INTO tracks (album_id, title, subtitle, duration, file_path, sort_order)
         VALUES (@album_id, @title, @subtitle, @duration, @file_path, @sort_order)`,
      )
      .run({
        album_id: input.album_id,
        title: input.title,
        subtitle: input.subtitle ?? null,
        duration: input.duration ?? null,
        file_path: input.file_path ?? null,
        sort_order: input.sort_order ?? 0,
      } as Record<string, string | number | null>) as unknown as {
      lastInsertRowid: number | bigint
    }
    return this.db
      .prepare('SELECT * FROM tracks WHERE id = ?')
      .get(Number(info.lastInsertRowid)) as unknown as TrackRow
  }

  findTrack(id: number): TrackRow | null {
    return (
      (this.db.prepare('SELECT * FROM tracks WHERE id = ?').get(id) as unknown as
        | TrackRow
        | undefined) ?? null
    )
  }

  deleteTrack(id: number): boolean {
    const info = this.db.prepare('DELETE FROM tracks WHERE id = ?').run(id) as {
      changes: number
    }
    return info.changes > 0
  }
}
