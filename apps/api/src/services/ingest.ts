import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { config } from '../config.js'
import { logger } from '../lib/logger.js'
import { parseMarkdown } from '../lib/markdown.js'
import { toSlug } from '../lib/slug.js'
import { PostRepo } from '../db/posts.repo.js'
import { TagRepo } from '../db/tags.repo.js'
import { IngestLogRepo } from '../db/ingest-log.repo.js'

export interface IngestOptions {
  source: 'inbox' | 'agent' | 'upload' | 'cron'
  targetSlug?: string
  contentOverride?: string
}

const postRepo = new PostRepo()
const tagRepo = new TagRepo()
const logRepo = new IngestLogRepo()

export interface IngestResult {
  slug: string
  postId: number
}

export async function ingestMarkdownFile(
  filePath: string,
  opts: IngestOptions,
): Promise<IngestResult> {
  const raw =
    opts.contentOverride ?? (await fs.readFile(filePath, 'utf-8'))
  const filename = path.basename(filePath)

  let parsed
  try {
    parsed = parseMarkdown(raw)
  } catch (err) {
    logRepo.record({
      source: opts.source,
      filename,
      status: 'error',
      message: String(err),
    })
    throw err
  }

  const fm = parsed.data as {
    title?: string
    slug?: string
    summary?: string
    tags?: string[] | string
    status?: 'draft' | 'scheduled' | 'published' | 'archived'
    publishAt?: string
    cover?: string
    category?: string
  }

  const title = fm.title ?? filename.replace(/\.md$/, '')
  const slug =
    fm.slug ?? opts.targetSlug ?? toSlug(filename.replace(/\.md$/, ''))
  const status = fm.status ?? 'published'
  const category = fm.category ?? null
  const tags = Array.isArray(fm.tags)
    ? fm.tags
    : typeof fm.tags === 'string'
      ? fm.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []

  // 移动到 published/<year>/<month>/<slug>/index.md
  const year = new Date().toISOString().slice(0, 4)
  const month = new Date().toISOString().slice(5, 7)
  const targetDir = path.join(config.publishedDir, year, month, slug)
  const targetPath = path.join(targetDir, 'index.md')
  await fs.mkdir(targetDir, { recursive: true })

  // 重写（保持 frontmatter + body）
  const finalRaw = matter.stringify(parsed.content, parsed.data)
  await fs.writeFile(targetPath, finalRaw, 'utf-8')

  // 入库
  const existing = postRepo.findBySlug(slug)
  let post
  if (existing) {
    post = postRepo.update(slug, {
      title,
      summary: fm.summary ?? null,
      content_md: parsed.content,
      content_html: parsed.html,
      source_path: targetPath,
      status,
      publish_at: fm.publishAt ?? null,
      reading_time: parsed.readingTime,
      cover_image: fm.cover ?? null,
      category,
    })
  } else {
    post = postRepo.create({
      slug,
      title,
      summary: fm.summary ?? null,
      content_md: parsed.content,
      content_html: parsed.html,
      source_path: targetPath,
      status,
      publish_at: fm.publishAt ?? null,
      reading_time: parsed.readingTime,
      cover_image: fm.cover ?? null,
      category,
    })
  }

  if (!post) {
    throw new Error('Failed to create or update post')
  }

  // 标签
  const tagIds = tags.map((t) => tagRepo.upsertByName(t))
  tagRepo.replaceForPost(post.id, tagIds)

  // 删除 inbox 原文件（仅当 source=inbox 且非 contentOverride）
  if (!opts.contentOverride && opts.source === 'inbox') {
    try {
      await fs.unlink(filePath)
    } catch (err) {
      logger.warn({ err, filePath }, 'failed to remove inbox file after ingest')
    }
  }

  logRepo.record({
    source: opts.source,
    filename,
    postId: post.id,
    status: 'ok',
    message: `ingested to ${targetPath}`,
  })

  return { slug, postId: post.id }
}
