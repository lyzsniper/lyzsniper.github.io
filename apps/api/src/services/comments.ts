/**
 * 评论业务逻辑 + 简易反垃圾
 *
 * 反垃圾策略：
 * 1. 空 body / 纯空格 / body 长度 < 2 → reject
 * 2. body 中 URL 数量 > 3 → reject（常见 spam）
 * 3. 同一 IP 短时间（60s）重复提交 → throttle
 * 4. author 含 http:// / https:// / <script → reject
 */

import { getDb } from '../db/sqlite.js'

export interface CreateCommentInput {
  postId: number
  parentId?: number | null
  author: string
  email?: string | null
  website?: string | null
  body: string
  ip?: string | null
  userAgent?: string | null
}

const MAX_URLS = 3

export class CommentError extends Error {
  constructor(
    message: string,
    public readonly code: 'bad_request' | 'not_found' | 'throttled' | 'spam',
  ) {
    super(message)
  }
}

function countUrls(text: string): number {
  return (text.match(/https?:\/\//gi) ?? []).length
}

function looksLikeSpam(body: string, author: string): boolean {
  if (/<script[\s>]/i.test(body) || /<script[\s>]/i.test(author)) return true
  if (/https?:\/\//i.test(author)) return true
  if (countUrls(body) > MAX_URLS) return true
  return false
}

export function listComments(postId: number) {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT id, post_id, parent_id, author, website, body, created_at
         FROM comments
        WHERE post_id = ? AND status = 'approved'
        ORDER BY created_at ASC`,
    )
    .all(postId) as Record<string, unknown>[]
  return rows.map((r) => ({
    id: r.id as number,
    postId: r.post_id as number,
    parentId: r.parent_id as number | null,
    author: r.author as string,
    website: r.website as string | null,
    body: r.body as string,
    createdAt: r.created_at as string,
  }))
}

export function createComment(input: CreateCommentInput) {
  const body = input.body.trim()
  const author = input.author.trim()

  if (!author || author.length < 1 || author.length > 60) {
    throw new CommentError('author 字段长度需要在 1-60 字符之间', 'bad_request')
  }
  if (!body || body.length < 2 || body.length > 5000) {
    throw new CommentError('评论内容需要在 2-5000 字符之间', 'bad_request')
  }
  if (looksLikeSpam(body, author)) {
    throw new CommentError('疑似垃圾评论', 'spam')
  }

  const db = getDb()

  // 验证 post 存在
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(input.postId)
  if (!post) throw new CommentError('文章不存在', 'not_found')

  // 验证 parent 在同一篇 post 下
  if (input.parentId) {
    const parent = db
      .prepare('SELECT id FROM comments WHERE id = ? AND post_id = ?')
      .get(input.parentId, input.postId)
    if (!parent) throw new CommentError('父评论不存在', 'not_found')
  }

  // 节流：同一 IP 60s 内不允许重复
  if (input.ip) {
    const recent = db
      .prepare(
        `SELECT id FROM comments
          WHERE ip = ? AND created_at > datetime('now', '-60 seconds')
          ORDER BY created_at DESC LIMIT 1`,
      )
      .get(input.ip)
    if (recent) throw new CommentError('评论过于频繁，稍后再试', 'throttled')
  }

  // website 必须有 http:// 前缀
  let website = input.website?.trim() || null
  if (website && !/^https?:\/\//i.test(website)) {
    website = `https://${website}`
  }
  const email = input.email?.trim() || null

  const info = db
    .prepare(
      `INSERT INTO comments (post_id, parent_id, author, email, website, body, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.postId,
      input.parentId ?? null,
      author,
      email,
      website,
      body,
      input.ip ?? null,
      input.userAgent ?? null,
    )

  return {
    id: Number(info.lastInsertRowid),
    postId: input.postId,
    parentId: input.parentId ?? null,
    author,
    website,
    body,
    createdAt: new Date().toISOString(),
  }
}
