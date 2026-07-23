import type { FastifyInstance } from 'fastify'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config.js'
import { MusicRepo } from '../db/music.repo.js'
import { toSlug } from '../lib/slug.js'
import { logger } from '../lib/logger.js'

const repo = new MusicRepo()

const AUDIO_EXT = new Set(['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac'])
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

function albumJson(albumSlug: string) {
  const album = repo.findAlbumBySlug(albumSlug)
  if (!album) return null
  const tracks = repo.listTracks(album.id).map((t) => ({
    id: t.id,
    title: t.title,
    subtitle: t.subtitle,
    duration: t.duration,
    audioUrl: t.file_path ? `/api/media/music/${path.basename(t.file_path)}` : null,
    sortOrder: t.sort_order,
  }))
  return {
    slug: album.slug,
    title: album.title,
    type: album.type,
    description: album.description,
    hue: album.hue,
    year: album.year,
    coverUrl: album.cover_path
      ? `/api/media/music/${path.basename(album.cover_path)}`
      : null,
    tracks,
  }
}

export async function musicRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/music/albums — 公开：专辑列表（含曲目）
  app.get('/albums', async () => {
    const albums = repo.listAlbums().map((a) => albumJson(a.slug))
    return { albums }
  })

  // GET /api/music/albums/:slug — 公开：专辑详情
  app.get<{ Params: { slug: string } }>('/albums/:slug', async (req, reply) => {
    const data = albumJson(req.params.slug)
    if (!data) return reply.code(404).send({ error: 'album not found' })
    return data
  })

  // POST /api/music/albums — 管理：新建专辑
  app.post<{
    Body: {
      title: string
      slug?: string
      type?: 'album' | 'ep' | 'single'
      description?: string
      hue?: number
      year?: number
    }
  }>('/albums', async (req, reply) => {
    const { title, slug, type, description, hue, year } = req.body ?? {}
    if (!title) return reply.code(400).send({ error: 'title required' })
    const finalSlug = slug?.trim() || toSlug(title)
    if (repo.findAlbumBySlug(finalSlug)) {
      return reply.code(409).send({ error: 'slug exists' })
    }
    return repo.createAlbum({ slug: finalSlug, title, type, description, hue, year })
  })

  // PUT /api/music/albums/:slug — 管理：更新专辑信息（含介绍）
  app.put<{
    Params: { slug: string }
    Body: Partial<{
      title: string
      type: 'album' | 'ep' | 'single'
      description: string
      hue: number
      year: number
    }>
  }>('/albums/:slug', async (req, reply) => {
    const album = repo.findAlbumBySlug(req.params.slug)
    if (!album) return reply.code(404).send({ error: 'album not found' })
    return repo.updateAlbum(req.params.slug, req.body ?? {})
  })

  // POST /api/music/albums/:slug/cover — 管理：上传专辑封面（图片）
  app.post<{ Params: { slug: string } }>('/albums/:slug/cover', async (req, reply) => {
    const album = repo.findAlbumBySlug(req.params.slug)
    if (!album) return reply.code(404).send({ error: 'album not found' })

    const data = await req.file()
    if (!data) return reply.code(400).send({ error: 'image file required' })
    const ext = path.extname(data.filename).toLowerCase()
    if (!IMAGE_EXT.has(ext)) {
      return reply.code(400).send({ error: `unsupported image type: ${ext}` })
    }

    const dir = path.join(config.uploadsDir, 'music')
    await fsp.mkdir(dir, { recursive: true })
    const asciiSlug = toSlug(album.slug).replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '') || 'album'
    const filename = `${asciiSlug}-cover-${Date.now()}${ext}`
    const filePath = path.join(dir, filename)
    await fsp.writeFile(filePath, await data.toBuffer())
    logger.info({ file: filePath }, 'album cover uploaded')

    // 旧封面清理
    if (album.cover_path && fs.existsSync(album.cover_path)) {
      await fsp.unlink(album.cover_path).catch(() => {})
    }
    return repo.updateAlbum(req.params.slug, { cover_path: filePath })
  })

  // DELETE /api/music/albums/:slug — 管理：删除专辑（级联删曲目）
  app.delete<{ Params: { slug: string } }>('/albums/:slug', async (req, reply) => {
    const ok = repo.deleteAlbum(req.params.slug)
    if (!ok) return reply.code(404).send({ error: 'album not found' })
    return { ok: true }
  })

  // POST /api/music/albums/:slug/tracks — 管理：上传曲目（音频 + 元信息）
  app.post<{ Params: { slug: string } }>('/albums/:slug/tracks', async (req, reply) => {
    const album = repo.findAlbumBySlug(req.params.slug)
    if (!album) return reply.code(404).send({ error: 'album not found' })

    const data = await req.file()
    if (!data) return reply.code(400).send({ error: 'audio file required' })
    const ext = path.extname(data.filename).toLowerCase()
    if (!AUDIO_EXT.has(ext)) {
      return reply.code(400).send({ error: `unsupported audio type: ${ext}` })
    }

    const fields = data.fields as Record<string, { value?: string } | undefined>
    const title = fields.title?.value?.trim() || path.basename(data.filename, ext)
    const subtitle = fields.subtitle?.value?.trim() || null
    const duration = fields.duration?.value ? Math.round(Number(fields.duration.value)) : null

    const dir = path.join(config.uploadsDir, 'music')
    await fsp.mkdir(dir, { recursive: true })
    // 纯 ASCII 文件名，避免非 ASCII 路径在静态服务/代理层的兼容问题
    const asciiSlug = toSlug(album.slug).replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '') || 'album'
    const filename = `${asciiSlug}-${Date.now()}${ext}`
    const filePath = path.join(dir, filename)
    await fsp.writeFile(filePath, await data.toBuffer())
    logger.info({ file: filePath, size: fs.statSync(filePath).size }, 'track uploaded')

    const count = repo.listTracks(album.id).length
    return repo.createTrack({
      album_id: album.id,
      title,
      subtitle,
      duration,
      file_path: filePath,
      sort_order: count,
    })
  })

  // DELETE /api/music/tracks/:id — 管理：删除曲目（同时删文件）
  app.delete<{ Params: { id: string } }>('/tracks/:id', async (req, reply) => {
    const id = Number(req.params.id)
    const track = repo.findTrack(id)
    if (!track) return reply.code(404).send({ error: 'track not found' })
    if (track.file_path && fs.existsSync(track.file_path)) {
      await fsp.unlink(track.file_path).catch(() => {})
    }
    repo.deleteTrack(id)
    return { ok: true }
  })
}
