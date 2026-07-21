/**
 * SEO 路由：sitemap.xml + robots.txt
 *
 * 自动生成：
 * - sitemap.xml：扫描已发布文章 slug，带 lastmod + hreflang
 * - robots.txt：允许所有爬虫，指向 sitemap
 */
import type { FastifyInstance } from 'fastify'
import { PostRepo } from '../db/posts.repo.js'

const postRepo = new PostRepo()

export async function seoRoutes(app: FastifyInstance): Promise<void> {
  app.get('/sitemap.xml', async (_req, reply) => {
    reply.header('Content-Type', 'application/xml; charset=utf-8')

    // 取最近 1000 篇已发布文章的 slug + 更新时间
    const { rows } = postRepo.list({ page: 1, pageSize: 1000, status: 'published' })

    const base = process.env.SITE_BASE ?? 'https://lyzsniper.github.io'

    const urls: string[] = []
    // 首页（双语）
    urls.push(xmlUrl(base, '/', '1.0'))
    urls.push(xmlUrl(base, '/en', '1.0'))

    for (const row of rows) {
      const priority = '0.7'
      const lastmod = (row.created_at ?? '').slice(0, 10)
      urls.push(xmlUrl(base, `/blog/${row.slug}`, priority, lastmod))
      // 英文版同路径（假设双语 slug 相同，由 react-i18n 切换文案；若无翻译可移除该行）
      urls.push(xmlUrl(base, `/en/blog/${row.slug}`, priority, lastmod))
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`
  })

  app.get('/robots.txt', async (_req, reply) => {
    reply.header('Content-Type', 'text/plain; charset=utf-8')
    const base = process.env.SITE_BASE ?? 'https://lyzsniper.github.io'
    return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: ${base}/sitemap.xml
`
  })
}

function xmlUrl(loc: string, path: string, priority: string, lastmod?: string): string {
  const lastmodXml = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
  // 自动生成 hreflang x-default：同一个 path 对应 zh + en
  const langPath = path.startsWith('/en') ? path : `/en${path === '/' ? '' : path}`
  return `  <url>
    <loc>${loc}${path}</loc>${lastmodXml}
    <xhtml:link rel="alternate" hreflang="zh" href="${loc}${path}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${loc}${langPath}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}${path}"/>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`
}
