import { marked, type Tokens } from 'marked'
import matter from 'gray-matter'
import hljs from 'highlight.js'

marked.setOptions({
  gfm: true,
  breaks: false,
})

// 自定义 code 渲染以接入 highlight.js
marked.use({
  renderer: {
    code(this: unknown, token: Tokens.Code): string {
      const lang = token.lang && hljs.getLanguage(token.lang) ? token.lang : 'plaintext'
      const highlighted = hljs.highlight(token.text, { language: lang }).value
      return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`
    },
  },
})

export interface ParsedMarkdown {
  data: Record<string, unknown>
  content: string
  html: string
  readingTime: number
  toc: { level: number; text: string; slug: string }[]
}

export function parseMarkdown(raw: string): ParsedMarkdown {
  const { data, content } = matter(raw)
  const html = marked.parse(content, { async: false }) as string
  const readingTime = Math.max(1, Math.round(content.length / 500))
  const toc = extractToc(content)
  return { data, content, html, readingTime, toc }
}

export function extractToc(md: string): { level: number; text: string; slug: string }[] {
  const out: { level: number; text: string; slug: string }[] = []
  const lines = md.split('\n')
  let inCode = false
  for (const line of lines) {
    if (line.startsWith('```')) {
      inCode = !inCode
      continue
    }
    if (inCode) continue
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(line)
    if (m) {
      const text = m[2].replace(/[*_`]/g, '').trim()
      const slug = text
        .toLowerCase()
        .replace(/[\s_]+/g, '-')
        .replace(/[^a-z0-9-一-龥]/g, '')
      out.push({ level: m[1].length, text, slug })
    }
  }
  return out
}
