import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import matter from 'gray-matter'

interface Frontmatter {
  title: string
  slug: string
  date: string
  tags: string
  summary: string
  status: 'draft' | 'published'
  category: string
}

const defaultFm: Frontmatter = {
  title: '',
  slug: '',
  date: new Date().toISOString().slice(0, 10),
  tags: '',
  summary: '',
  status: 'published',
  category: '',
}

const sample = `# 在这里写正文

支持 **Markdown** 全语法：

- 列表
- \`代码\`
- 链接

\`\`\`typescript
function hello() {
  console.log('Hello, Jensen!')
}
\`\`\`
`

function buildMarkdown(fm: Frontmatter, body: string): string {
  const tags = fm.tags
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const catLine = fm.category.trim() ? `category: ${fm.category.trim()}\n` : ''
  return `---
title: ${fm.title}
slug: ${fm.slug}
date: ${fm.date}
${catLine}tags: [${tags.join(', ')}]
summary: ${fm.summary}
status: ${fm.status}
---

${body}`
}

export default function Editor() {
  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const [fm, setFm] = useState<Frontmatter>(defaultFm)
  const [body, setBody] = useState<string>(sample)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setMessage(null)
    fetch(`/api/posts/${encodeURIComponent(slug)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text())
        return r.json()
      })
      .then((post) => {
        const parsed = matter(post.contentMd ?? '')
        const data = parsed.data as Record<string, unknown>
        const tags = Array.isArray(data.tags)
          ? (data.tags as string[]).join(', ')
          : typeof data.tags === 'string'
            ? data.tags
            : ''
        setFm({
          title: (data.title as string) ?? post.title ?? '',
          slug: (data.slug as string) ?? post.slug ?? '',
          date: (data.date as string)?.slice(0, 10) ?? defaultFm.date,
          tags,
          summary: (data.summary as string) ?? post.summary ?? '',
          status: ((data.status as 'draft' | 'published') ?? post.status ?? 'published'),
          category: (data.category as string) ?? post.category ?? '',
        })
        setBody(parsed.content)
      })
      .catch((e) => setMessage(`❌ 加载失败: ${e instanceof Error ? e.message : String(e)}`))
      .finally(() => setLoading(false))
  }, [slug])

  const isEdit = !!slug

  const onSave = async () => {
    if (!fm.title.trim() || !fm.slug.trim()) {
      setMessage('❌ 标题和 slug 必填')
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const url = isEdit
        ? `/api/posts/${encodeURIComponent(slug!)}`
        : '/api/posts'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: fm.slug,
          title: fm.title,
          summary: fm.summary || undefined,
          contentMd: buildMarkdown(fm, body),
          tags: fm.tags
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          status: fm.status,
          category: fm.category.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `HTTP ${res.status}`)
      }
      setMessage(`✅ ${isEdit ? '更新' : '创建'}成功`)
      setTimeout(() => navigate(`/blog/${fm.slug}`), 800)
    } catch (e) {
      setMessage(`❌ 保存失败: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="pt-24 px-6 text-center text-text-secondary">加载中...</div>
  }

  return (
    <div className="pt-24 px-6 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="font-orbitron text-3xl font-bold neon-text-blue">
          {isEdit ? '编辑文章' : '新建文章'}
        </h1>
        <div className="flex gap-2">
          <Link
            to="/admin"
            className="px-4 py-2 rounded border border-neon-blue/30 text-text-secondary hover:neon-text-blue text-sm"
          >
            ← 返回
          </Link>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 rounded border border-neon-blue neon-text-blue hover:bg-neon-blue/10 disabled:opacity-50 text-sm"
          >
            {saving ? '保存中...' : isEdit ? '💾 更新' : '💾 保存发布'}
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded border border-neon-blue/30 bg-neon-blue/5 text-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Field label="标题">
          <input
            value={fm.title}
            onChange={(e) => setFm({ ...fm, title: e.target.value })}
            className="w-full px-3 py-2 rounded bg-card-bg border border-neon-blue/30 focus:border-neon-blue outline-none"
            placeholder="文章标题"
          />
        </Field>
        <Field label="Slug (URL)">
          <input
            value={fm.slug}
            onChange={(e) => setFm({ ...fm, slug: e.target.value })}
            disabled={isEdit}
            className="w-full px-3 py-2 rounded bg-card-bg border border-neon-blue/30 focus:border-neon-blue outline-none font-mono text-sm disabled:opacity-50"
            placeholder="my-post-slug"
          />
        </Field>
        <Field label="日期">
          <input
            type="date"
            value={fm.date}
            onChange={(e) => setFm({ ...fm, date: e.target.value })}
            className="w-full px-3 py-2 rounded bg-card-bg border border-neon-blue/30 focus:border-neon-blue outline-none"
          />
        </Field>
        <Field label="标签 (逗号分隔)">
          <input
            value={fm.tags}
            onChange={(e) => setFm({ ...fm, tags: e.target.value })}
            className="w-full px-3 py-2 rounded bg-card-bg border border-neon-blue/30 focus:border-neon-blue outline-none"
            placeholder="React, TypeScript, AI"
          />
        </Field>
        <Field label="分类（层级用 / 分隔，如 技术/AI）">
          <input
            value={fm.category}
            onChange={(e) => setFm({ ...fm, category: e.target.value })}
            className="w-full px-3 py-2 rounded bg-card-bg border border-neon-blue/30 focus:border-neon-blue outline-none font-mono text-sm"
            placeholder="技术/AI/Agent"
          />
        </Field>
        <Field label="摘要">
          <input
            value={fm.summary}
            onChange={(e) => setFm({ ...fm, summary: e.target.value })}
            className="w-full px-3 py-2 rounded bg-card-bg border border-neon-blue/30 focus:border-neon-blue outline-none"
            placeholder="一句话简介"
          />
        </Field>
        <Field label="状态">
          <select
            value={fm.status}
            onChange={(e) =>
              setFm({ ...fm, status: e.target.value as 'draft' | 'published' })
            }
            className="w-full px-3 py-2 rounded bg-card-bg border border-neon-blue/30 focus:border-neon-blue outline-none"
          >
            <option value="published">published</option>
            <option value="draft">draft</option>
          </select>
        </Field>
      </div>

      <div data-color-mode="dark">
        <MDEditor value={body} onChange={(v) => setBody(v ?? '')} height={500} />
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-text-secondary mb-1 block">{label}</span>
      {children}
    </label>
  )
}
