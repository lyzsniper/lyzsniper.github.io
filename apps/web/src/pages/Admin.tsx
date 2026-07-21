import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload,
  Pencil,
  Inbox,
  Tags as TagsIcon,
  List,
  Trash2,
  RefreshCw,
  FileText,
  BarChart3,
  Star,
} from 'lucide-react'
import type { PostSummary } from '@/lib/api'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth'

interface AdminPost extends PostSummary {
  status: string
  viewCount: number
}

export default function Admin() {
  const { t } = useTranslation('admin')
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const user = useAuthStore((s) => s.user)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [published, draft] = await Promise.all([
        fetch('/api/posts?status=published&pageSize=100').then((r) => r.json()),
        fetch('/api/posts?status=draft&pageSize=100').then((r) => r.json()),
      ])
      const all = [...(published.posts ?? []), ...(draft.posts ?? [])] as AdminPost[]
      all.sort((a, b) => {
        if (a.status !== b.status) return a.status === 'published' ? -1 : 1
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
      setPosts(all)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('postList.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const onDelete = async (slug: string) => {
    if (!confirm(t('postList.deleteConfirm', { slug }))) return
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error(await res.text())
      setPosts((prev) => prev.filter((p) => p.slug !== slug))
    } catch (e) {
      alert(t('postList.deleteFailed', { msg: e instanceof Error ? e.message : String(e) }))
    }
  }

  // 精选开关：PUT 写库后本地同步
  const onToggleFeatured = async (slug: string, featured: boolean) => {
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured }),
      })
      if (!res.ok) throw new Error(await res.text())
      setPosts((prev) => prev.map((p) => (p.slug === slug ? { ...p, featured } : p)))
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    }
  }

  const uploadFile = async (file: File) => {
    if (!file.name.endsWith('.md')) {
      setUploadMsg(t('upload.onlyMd'))
      return
    }
    setUploading(true)
    setUploadMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'upload failed')
      setUploadMsg(t('upload.ingested', { slug: data.slug }))
      if (fileRef.current) fileRef.current.value = ''
      await load()
    } catch (err) {
      setUploadMsg(t('upload.failed', { msg: err instanceof Error ? err.message : String(err) }))
    } finally {
      setUploading(false)
    }
  }

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) await uploadFile(file)
  }

  const totalViews = posts.reduce((s, p) => s + (p.viewCount ?? 0), 0)
  const published = posts.filter((p) => p.status === 'published').length
  const drafts = posts.filter((p) => p.status === 'draft').length

  return (
    <div className="container-page py-12 md:py-16">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <div className="eyebrow mb-2">
            <Pencil size={12} className="text-[var(--accent)]" />
            {t('title')}
          </div>
          <h1 className="text-display-lg text-[var(--fg-primary)]">
            {user?.username ?? 'Admin'}
          </h1>
          <p className="text-sm text-[var(--fg-secondary)] mt-2">
            {t('subtitle')}
          </p>
        </div>
        <button onClick={() => void load()} className="btn btn-secondary btn-sm">
          <RefreshCw size={13} /> {t('refresh')}
        </button>
      </div>

      {!loading && posts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <div className="surface-card p-4">
            <div className="text-xs text-[var(--fg-tertiary)] mb-1">{t('stats.total')}</div>
            <div className="text-2xl font-semibold tabular-nums">{posts.length}</div>
          </div>
          <div className="surface-card p-4">
            <div className="text-xs text-[var(--fg-tertiary)] mb-1">{t('stats.published')}</div>
            <div className="text-2xl font-semibold tabular-nums text-[var(--accent)]">{published}</div>
          </div>
          <div className="surface-card p-4">
            <div className="text-xs text-[var(--fg-tertiary)] mb-1">{t('stats.drafts')}</div>
            <div className="text-2xl font-semibold tabular-nums">{drafts}</div>
          </div>
          <div className="surface-card p-4">
            <div className="text-xs text-[var(--fg-tertiary)] mb-1">{t('stats.views')}</div>
            <div className="text-2xl font-semibold tabular-nums">{totalViews.toLocaleString()}</div>
          </div>
        </div>
      )}

      <section className="surface-card p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Upload size={16} strokeWidth={1.75} className="text-[var(--accent)]" />
          <h2 className="text-base font-semibold text-[var(--fg-primary)]">{t('upload.title')}</h2>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className="cursor-pointer rounded-lg p-10 text-center transition-all"
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-default)'}`,
            backgroundColor: dragOver ? 'var(--accent-soft)' : 'transparent',
          }}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-[var(--fg-secondary)]">{t('upload.uploading')}</span>
            </div>
          ) : (
            <>
              <FileText size={28} className="mx-auto mb-3 text-[var(--fg-tertiary)]" strokeWidth={1.5} />
              <p className="text-sm text-[var(--fg-secondary)]">
                {t('upload.dropHint')} <span className="text-[var(--accent)] underline">{t('upload.clickSelect')}</span>
              </p>
              <p className="text-xs text-[var(--fg-tertiary)] mt-1.5">
                {t('upload.autoIngest')}
              </p>
            </>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".md,text/markdown"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void uploadFile(file)
          }}
        />

        {uploadMsg && (
          <p className="mt-3 text-sm text-[var(--fg-secondary)]">{uploadMsg}</p>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
        <Link
          to="/admin/editor"
          className="surface-card-interactive p-5 flex items-start gap-3 group"
        >
          <Pencil size={18} className="text-[var(--accent)] shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <h3 className="text-sm font-semibold text-[var(--fg-primary)] group-hover:text-[var(--accent)] transition-colors">
              {t('quickActions.newPost.title')}
            </h3>
            <p className="text-xs text-[var(--fg-tertiary)] mt-1">{t('quickActions.newPost.desc')}</p>
          </div>
        </Link>
        <Link
          to="/admin/inbox"
          className="surface-card-interactive p-5 flex items-start gap-3 group"
        >
          <Inbox size={18} className="text-[var(--accent)] shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <h3 className="text-sm font-semibold text-[var(--fg-primary)] group-hover:text-[var(--accent)] transition-colors">
              {t('quickActions.inbox.title')}
            </h3>
            <p className="text-xs text-[var(--fg-tertiary)] mt-1">{t('quickActions.inbox.desc')}</p>
          </div>
        </Link>
        <Link
          to="/admin/tags"
          className="surface-card-interactive p-5 flex items-start gap-3 group"
        >
          <TagsIcon size={18} className="text-[var(--accent)] shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <h3 className="text-sm font-semibold text-[var(--fg-primary)] group-hover:text-[var(--accent)] transition-colors">
              {t('quickActions.tags.title')}
            </h3>
            <p className="text-xs text-[var(--fg-tertiary)] mt-1">{t('quickActions.tags.desc')}</p>
          </div>
        </Link>
        <Link
          to="/admin/stats"
          className="surface-card-interactive p-5 flex items-start gap-3 group"
        >
          <BarChart3 size={18} className="text-[var(--accent)] shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <h3 className="text-sm font-semibold text-[var(--fg-primary)] group-hover:text-[var(--accent)] transition-colors">
              {t('quickActions.stats.title')}
            </h3>
            <p className="text-xs text-[var(--fg-tertiary)] mt-1">{t('quickActions.stats.desc')}</p>
          </div>
        </Link>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <List size={16} className="text-[var(--accent)]" strokeWidth={1.75} />
          <h2 className="text-base font-semibold text-[var(--fg-primary)]">{t('postList.title')}</h2>
        </div>

        {loading && <p className="text-sm text-[var(--fg-tertiary)] py-12 text-center">{t('postList.loading')}</p>}
        {error && (
          <div
            className="px-4 py-3 rounded-md text-sm"
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.08)',
              color: '#dc2626',
              border: '1px solid rgba(220, 38, 38, 0.16)',
            }}
          >
            {error}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="surface-card p-16 text-center">
            <p className="text-sm text-[var(--fg-secondary)]">{t('postList.empty')}</p>
          </div>
        )}

        <div className="space-y-2">
          {posts.map((p) => (
            <article key={p.id} className="surface-card p-4 flex items-center gap-4 group">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor: p.status === 'published' ? 'var(--accent)' : 'var(--fg-quaternary)',
                }}
                title={p.status === 'published' ? t('postList.published') : t('postList.draft')}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/blog/${p.slug}`}
                    className="font-medium text-[var(--fg-primary)] group-hover:text-[var(--accent)] transition-colors"
                  >
                    {p.title}
                  </Link>
                  <span className="text-xs text-[var(--fg-tertiary)] font-mono">{p.slug}</span>
                  <span
                    className={`pill !h-5 !text-[10px] ${
                      p.status === 'published' ? 'pill-accent' : ''
                    }`}
                  >
                    {p.status === 'published' ? t('postList.published') : t('postList.draft')}
                  </span>
                  {p.featured && (
                    <span className="pill pill-featured !h-5 !text-[10px]">
                      ★ {t('postList.featured')}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--fg-tertiary)] mt-1 flex items-center gap-3 flex-wrap">
                  <span className="font-mono">{new Date(p.date).toLocaleDateString('zh-CN')}</span>
                  {p.readingTime !== null && <span>{t('postList.readingTime', { count: p.readingTime })}</span>}
                  <span>{t('postList.views', { count: p.viewCount })}</span>
                  {p.category && <span>📂 {p.category}</span>}
                </div>
                {p.tags.length > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {p.tags.map((tag) => (
                      <span key={tag} className="pill !h-5 !text-[10px]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => void onToggleFeatured(p.slug, !p.featured)}
                  className={`btn btn-ghost btn-sm ${p.featured ? 'text-[#f59e0b]' : ''}`}
                  aria-label={p.featured ? t('postList.unfeature') : t('postList.feature')}
                  title={p.featured ? t('postList.unfeature') : t('postList.feature')}
                >
                  <Star size={13} fill={p.featured ? 'currentColor' : 'none'} />
                </button>
                <Link
                  to={`/admin/editor/${encodeURIComponent(p.slug)}`}
                  className="btn btn-ghost btn-sm"
                  aria-label="edit"
                >
                  <Pencil size={13} />
                </Link>
                <button
                  type="button"
                  onClick={() => void onDelete(p.slug)}
                  className="btn btn-ghost btn-sm hover:text-[#dc2626]"
                  aria-label="delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
