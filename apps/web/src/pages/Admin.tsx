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
} from 'lucide-react'
import type { PostSummary } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface AdminPost extends PostSummary {
  status: string
  viewCount: number
}

export default function Admin() {
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
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onDelete = async (slug: string) => {
    if (!confirm(`确认删除「${slug}」？此操作不可恢复。`)) return
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error(await res.text())
      setPosts((prev) => prev.filter((p) => p.slug !== slug))
    } catch (e) {
      alert(`删除失败: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const uploadFile = async (file: File) => {
    if (!file.name.endsWith('.md')) {
      setUploadMsg('仅支持 .md 文件')
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
      if (!res.ok) throw new Error(data.error || '上传失败')
      setUploadMsg(`已收录: ${data.slug}`)
      if (fileRef.current) fileRef.current.value = ''
      await load()
    } catch (err) {
      setUploadMsg(`失败: ${err instanceof Error ? err.message : String(err)}`)
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
            管理后台
          </div>
          <h1 className="text-display-lg text-[var(--fg-primary)]">
            {user?.username ?? 'Admin'}
          </h1>
          <p className="text-sm text-[var(--fg-secondary)] mt-2">
            在这里管理文章、标签和文件。
          </p>
        </div>
        <button onClick={() => void load()} className="btn btn-secondary btn-sm">
          <RefreshCw size={13} /> 刷新
        </button>
      </div>

      {/* 统计 */}
      {!loading && posts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <div className="surface-card p-4">
            <div className="text-xs text-[var(--fg-tertiary)] mb-1">文章总数</div>
            <div className="text-2xl font-semibold tabular-nums">{posts.length}</div>
          </div>
          <div className="surface-card p-4">
            <div className="text-xs text-[var(--fg-tertiary)] mb-1">已发布</div>
            <div className="text-2xl font-semibold tabular-nums text-[var(--accent)]">{published}</div>
          </div>
          <div className="surface-card p-4">
            <div className="text-xs text-[var(--fg-tertiary)] mb-1">草稿</div>
            <div className="text-2xl font-semibold tabular-nums">{drafts}</div>
          </div>
          <div className="surface-card p-4">
            <div className="text-xs text-[var(--fg-tertiary)] mb-1">总浏览量</div>
            <div className="text-2xl font-semibold tabular-nums">{totalViews.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* 上传 */}
      <section className="surface-card p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Upload size={16} strokeWidth={1.75} className="text-[var(--accent)]" />
          <h2 className="text-base font-semibold text-[var(--fg-primary)]">上传 Markdown</h2>
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
              <span className="text-sm text-[var(--fg-secondary)]">上传中…</span>
            </div>
          ) : (
            <>
              <FileText size={28} className="mx-auto mb-3 text-[var(--fg-tertiary)]" strokeWidth={1.5} />
              <p className="text-sm text-[var(--fg-secondary)]">
                拖拽 .md 文件到这里，或 <span className="text-[var(--accent)] underline">点击选择</span>
              </p>
              <p className="text-xs text-[var(--fg-tertiary)] mt-1.5">
                上传后自动收录到 <code className="font-mono">content/published/</code> 并入库
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

      {/* 快捷操作 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
        <Link
          to="/admin/editor"
          className="surface-card-interactive p-5 flex items-start gap-3 group"
        >
          <Pencil size={18} className="text-[var(--accent)] shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <h3 className="text-sm font-semibold text-[var(--fg-primary)] group-hover:text-[var(--accent)] transition-colors">
              新建文章
            </h3>
            <p className="text-xs text-[var(--fg-tertiary)] mt-1">Web 编辑器（双栏实时预览）</p>
          </div>
        </Link>
        <Link
          to="/admin/inbox"
          className="surface-card-interactive p-5 flex items-start gap-3 group"
        >
          <Inbox size={18} className="text-[var(--accent)] shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <h3 className="text-sm font-semibold text-[var(--fg-primary)] group-hover:text-[var(--accent)] transition-colors">
              Inbox 文件
            </h3>
            <p className="text-xs text-[var(--fg-tertiary)] mt-1">查看待收录文件</p>
          </div>
        </Link>
        <Link
          to="/admin/tags"
          className="surface-card-interactive p-5 flex items-start gap-3 group"
        >
          <TagsIcon size={18} className="text-[var(--accent)] shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <h3 className="text-sm font-semibold text-[var(--fg-primary)] group-hover:text-[var(--accent)] transition-colors">
              标签管理
            </h3>
            <p className="text-xs text-[var(--fg-tertiary)] mt-1">为标签添加颜色和描述</p>
          </div>
        </Link>
      </div>

      {/* 文章列表 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <List size={16} className="text-[var(--accent)]" strokeWidth={1.75} />
          <h2 className="text-base font-semibold text-[var(--fg-primary)]">文章列表</h2>
        </div>

        {loading && <p className="text-sm text-[var(--fg-tertiary)] py-12 text-center">加载中…</p>}
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
            <p className="text-sm text-[var(--fg-secondary)]">还没有文章</p>
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
                title={p.status === 'published' ? '已发布' : '草稿'}
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
                    {p.status === 'published' ? '已发布' : '草稿'}
                  </span>
                </div>
                <div className="text-xs text-[var(--fg-tertiary)] mt-1 flex items-center gap-3 flex-wrap">
                  <span className="font-mono">{new Date(p.date).toLocaleDateString('zh-CN')}</span>
                  {p.readingTime !== null && <span>阅读 {p.readingTime} 分钟</span>}
                  <span>浏览 {p.viewCount}</span>
                  {p.category && <span>📂 {p.category}</span>}
                </div>
                {p.tags.length > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {p.tags.map((t) => (
                      <span key={t} className="pill !h-5 !text-[10px]">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-1 shrink-0">
                <Link
                  to={`/admin/editor/${encodeURIComponent(p.slug)}`}
                  className="btn btn-ghost btn-sm"
                  aria-label="编辑"
                >
                  <Pencil size={13} />
                </Link>
                <button
                  type="button"
                  onClick={() => void onDelete(p.slug)}
                  className="btn btn-ghost btn-sm hover:text-[#dc2626]"
                  aria-label="删除"
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