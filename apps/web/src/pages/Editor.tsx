import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, User as UserIcon } from 'lucide-react'
import MDEditor from '@uiw/react-md-editor'
import matter from 'gray-matter'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth'

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
  const { t } = useTranslation('editor')
  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const [fm, setFm] = useState<Frontmatter>(defaultFm)
  const [body, setBody] = useState<string>(sample)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setMessage(null)
    fetch(`/api/posts/${encodeURIComponent(slug)}`, { credentials: 'include' })
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
      .catch((e) => setMessage(t('loadFailed', { msg: e instanceof Error ? e.message : String(e) })))
      .finally(() => setLoading(false))
  }, [slug])

  const isEdit = !!slug

  const onSave = async () => {
    if (!fm.title.trim() || !fm.slug.trim()) {
      setMessage(t('requiredFields'))
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const url = isEdit ? `/api/posts/${encodeURIComponent(slug!)}` : '/api/posts'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          slug: fm.slug,
          title: fm.title,
          summary: fm.summary || undefined,
          contentMd: buildMarkdown(fm, body),
          tags: fm.tags.split(',').map((s) => s.trim()).filter(Boolean),
          status: fm.status,
          category: fm.category.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `HTTP ${res.status}`)
      }
      setMessage(isEdit ? t('saved') : t('created'))
      setTimeout(() => navigate(`/blog/${fm.slug}`), 600)
    } catch (e) {
      setMessage(t('saveFailed', { msg: e instanceof Error ? e.message : String(e) }))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container-page py-20 text-center text-sm text-[var(--fg-tertiary)]">
        {t('loading')}
      </div>
    )
  }

  return (
    <div className="container-page py-10 md:py-12">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="eyebrow mb-2">{isEdit ? t('editTitle') : t('newTitle')}</div>
          <h1 className="text-display-md text-[var(--fg-primary)]">
            {isEdit ? t('editHeading') : t('newHeading')}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--fg-tertiary)]">
            <UserIcon size={12} /> {user?.username ?? 'admin'}
          </span>
          <Link to="/admin" className="btn btn-ghost btn-sm">
            <ArrowLeft size={13} /> {t('back')}
          </Link>
          <button onClick={onSave} disabled={saving} className="btn btn-primary btn-sm">
            <Save size={13} /> {saving ? t('saving') : isEdit ? t('update') : t('savePublish')}
          </button>
        </div>
      </div>

      {message && (
        <div
          className="mb-4 px-3 py-2 rounded-md text-sm"
          style={{
            backgroundColor: 'var(--bg-muted)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--fg-secondary)',
          }}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <Field label={t('fields.title')}>
          <input
            className="input"
            value={fm.title}
            onChange={(e) => setFm({ ...fm, title: e.target.value })}
            placeholder={t('placeholders.title')}
          />
        </Field>
        <Field label={t('fields.slug')}>
          <input
            className="input font-mono"
            value={fm.slug}
            onChange={(e) => setFm({ ...fm, slug: e.target.value })}
            disabled={isEdit}
            placeholder={t('placeholders.slug')}
          />
        </Field>
        <Field label={t('fields.date')}>
          <input
            type="date"
            className="input"
            value={fm.date}
            onChange={(e) => setFm({ ...fm, date: e.target.value })}
          />
        </Field>
        <Field label={t('fields.tags')}>
          <input
            className="input"
            value={fm.tags}
            onChange={(e) => setFm({ ...fm, tags: e.target.value })}
            placeholder={t('placeholders.tags')}
          />
        </Field>
        <Field label={t('fields.category')}>
          <input
            className="input font-mono"
            value={fm.category}
            onChange={(e) => setFm({ ...fm, category: e.target.value })}
            placeholder={t('placeholders.category')}
          />
        </Field>
        <Field label={t('fields.summary')}>
          <input
            className="input"
            value={fm.summary}
            onChange={(e) => setFm({ ...fm, summary: e.target.value })}
            placeholder={t('placeholders.summary')}
          />
        </Field>
        <Field label={t('fields.status')}>
          <select
            className="input"
            value={fm.status}
            onChange={(e) => setFm({ ...fm, status: e.target.value as 'draft' | 'published' })}
          >
            <option value="published">published</option>
            <option value="draft">draft</option>
          </select>
        </Field>
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--border-default)' }}
        data-color-mode="auto"
      >
        <MDEditor value={body} onChange={(v) => setBody(v ?? '')} height={500} />
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[var(--fg-secondary)] mb-1.5 block">{label}</span>
      {children}
    </label>
  )
}