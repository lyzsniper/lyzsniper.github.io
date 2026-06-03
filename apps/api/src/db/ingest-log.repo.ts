import type Database from 'better-sqlite3'
import { getDb } from './sqlite.js'

export interface IngestLogInput {
  source: 'inbox' | 'agent' | 'upload' | 'cron'
  filename?: string
  postId?: number
  status: 'ok' | 'skipped' | 'error'
  message?: string
}

export interface IngestLogRow extends IngestLogInput {
  id: number
  created_at: string
}

export class IngestLogRepo {
  private _db: Database.Database | undefined
  private get db(): Database.Database {
    if (!this._db) this._db = getDb()
    return this._db
  }

  record(input: IngestLogInput): void {
    this.db
      .prepare(
        `INSERT INTO ingest_log (source, filename, post_id, status, message) VALUES (@source, @filename, @post_id, @status, @message)`,
      )
      .run({
        source: input.source,
        filename: input.filename ?? null,
        post_id: input.postId ?? null,
        status: input.status,
        message: input.message ?? null,
      })
  }

  recent(limit = 50): IngestLogRow[] {
    return this.db
      .prepare(`SELECT * FROM ingest_log ORDER BY created_at DESC LIMIT ?`)
      .all(limit) as IngestLogRow[]
  }
}
