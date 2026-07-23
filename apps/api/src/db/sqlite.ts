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

    CREATE TABLE IF NOT EXISTS comments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      parent_id   INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      author      TEXT NOT NULL,
      email       TEXT,
      website     TEXT,
      body        TEXT NOT NULL,
      ip          TEXT,
      user_agent  TEXT,
      status      TEXT NOT NULL DEFAULT 'approved',
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS page_views (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      path        TEXT NOT NULL,
      post_slug   TEXT,
      ip          TEXT,
      referrer    TEXT,
      user_agent  TEXT,
      status_code INTEGER,
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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

    CREATE TABLE IF NOT EXISTS sessions (
      token       TEXT PRIMARY KEY,
      username    TEXT NOT NULL,
      role        TEXT NOT NULL,
      created_at  INTEGER NOT NULL,        -- unix ms，方便比较
      expires_at  INTEGER NOT NULL         -- unix ms，懒清理
    );

    CREATE TABLE IF NOT EXISTS albums (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT UNIQUE NOT NULL,
      title       TEXT NOT NULL,
      type        TEXT NOT NULL DEFAULT 'album',  -- album | ep | single
      description TEXT,
      hue         INTEGER NOT NULL DEFAULT 242,   -- 生成封面色相
      year        INTEGER,
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tracks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      album_id    INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      subtitle    TEXT,
      duration    INTEGER,                        -- 秒
      file_path   TEXT,                           -- data/uploads/music/<file>
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_posts_status_date ON posts(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
  `)

  // 兼容旧库：增量加列（必须在依赖新列的索引之前）
  ensureColumn(db, 'posts', 'category', 'TEXT')
  ensureColumn(db, 'posts', 'series', 'TEXT')
  ensureColumn(db, 'posts', 'series_order', 'INTEGER')
  ensureColumn(db, 'posts', 'featured', 'INTEGER NOT NULL DEFAULT 0')
  ensureColumn(db, 'albums', 'cover_path', 'TEXT')
  ensureColumn(db, 'tags', 'color', 'TEXT')
  ensureColumn(db, 'tags', 'description', 'TEXT')
  ensureColumn(db, 'tags', 'created_at', "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP")

  db.exec('CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_posts_series ON posts(series)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at DESC)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at DESC)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album_id, sort_order)')

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
