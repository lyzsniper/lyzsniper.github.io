import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'

let db: DatabaseSync | null = null

export function initDb(): DatabaseSync {
  if (db) return db

  // 确保运行时目录存在
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true })
  fs.mkdirSync(config.inboxDir, { recursive: true })
  fs.mkdirSync(config.draftsDir, { recursive: true })
  fs.mkdirSync(config.publishedDir, { recursive: true })
  fs.mkdirSync(config.uploadsDir, { recursive: true })

  db = new DatabaseSync(config.dbPath)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      slug         TEXT UNIQUE NOT NULL,
      title        TEXT NOT NULL,
      summary      TEXT,
      content_md   TEXT NOT NULL,
      content_html TEXT,
      source_path  TEXT,
      status       TEXT NOT NULL DEFAULT 'published',
      publish_at   DATETIME,
      created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reading_time INTEGER,
      cover_image  TEXT,
      view_count   INTEGER DEFAULT 0,
      category     TEXT
    );

    CREATE TABLE IF NOT EXISTS tags (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT UNIQUE NOT NULL,
      slug        TEXT UNIQUE NOT NULL,
      color       TEXT,
      description TEXT,
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS post_tags (
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (post_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS assets (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id    INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      filename   TEXT NOT NULL,
      mime_type  TEXT,
      size       INTEGER,
      path       TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      role       TEXT NOT NULL DEFAULT 'admin',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS ingest_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      source     TEXT NOT NULL,
      filename   TEXT,
      post_id    INTEGER,
      status     TEXT NOT NULL,
      message    TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_posts_status_date ON posts(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag_id);
  `)

  // 兼容旧库：增量加列（必须在依赖新列的索引之前）
  ensureColumn(db, 'posts', 'category', 'TEXT')
  ensureColumn(db, 'tags', 'color', 'TEXT')
  ensureColumn(db, 'tags', 'description', 'TEXT')
  ensureColumn(db, 'tags', 'created_at', "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP")

  db.exec('CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)')

  return db
}

/**
 * 兼容旧库的迁移：检查列是否存在，不存在则 ALTER TABLE ADD COLUMN
 */
function ensureColumn(
  db: DatabaseSync,
  table: string,
  column: string,
  typeDef: string,
): void {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
  if (!cols.find((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeDef}`)
  }
}

export function getDb(): DatabaseSync {
  if (!db) throw new Error('DB not initialized. Call initDb() first.')
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
