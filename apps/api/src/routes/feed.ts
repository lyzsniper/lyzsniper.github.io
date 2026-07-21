import type { FastifyInstance } from 'fastify'
import { PostRepo } from '../db/posts.repo.js'
import { config } from '../config.js'

const postRepo = new PostRepo()

const SITE_URL = config.siteUrl
const SITE_TITLE = '刘酝泽的技术博客'
const SITE_DESCRIPTION = 'AI Agent 架构师、全栈开发者的技术笔记'
const AUTHOR = 'lyzsniper@gmail.com (刘酝泽)'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function feedRoutes(app: FastifyInstance): Promise<void> {
  app.get('/feed.xml', async (_req, reply) => {
    const { rows } = postRepo.list({
      page: 1,
      pageSize: 50,
      status: 'published',
    })

    const items = rows
      .map((r) => {
        const url = `${SITE_URL}/blog/${r.slug}`
        const pubDate = new Date(r.created_at).toUTCString()
        return `    <item>
      <title>${escapeXml(r.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(r.summary ?? '')}</description>
    </item>`
      })
      .join('\n')

    const lastBuild = rows[0]
      ? new Date(rows[0].created_at).toUTCString()
      : new Date().toUTCString()

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_TITLE}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>zh-CN</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <managingEditor>${AUTHOR}</managingEditor>
    <webMaster>${AUTHOR}</webMaster>
    <atom:link href="${SITE_URL}/api/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

    reply.header('Content-Type', 'application/rss+xml; charset=utf-8')
    return reply.send(xml)
  })

  // 同样暴露 atom 格式以兼容
  app.get('/atom.xml', async (_req, reply) => {
    const { rows } = postRepo.list({
      page: 1,
      pageSize: 50,
      status: 'published',
    })

    const updated = rows[0]
      ? new Date(rows[0].created_at).toISOString()
      : new Date().toISOString()

    const entries = rows
      .map((r) => {
        const url = `${SITE_URL}/blog/${r.slug}`
        const updated = new Date(r.created_at).toISOString()
        return `  <entry>
    <title>${escapeXml(r.title)}</title>
    <link href="${url}"/>
    <id>${url}</id>
    <updated>${updated}</updated>
    <summary>${escapeXml(r.summary ?? '')}</summary>
  </entry>`
      })
      .join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${SITE_TITLE}</title>
  <link href="${SITE_URL}"/>
  <updated>${updated}</updated>
  <id>${SITE_URL}/</id>
  <author>
    <name>刘酝泽</name>
    <email>lyzsniper@gmail.com</email>
  </author>
${entries}
</feed>`

    reply.header('Content-Type', 'application/atom+xml; charset=utf-8')
    return reply.send(xml)
  })
}
