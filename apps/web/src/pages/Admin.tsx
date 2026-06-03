import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { PostSummary } from '@/lib/api'

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

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const published = await fetch('/api/posts?status=published&pageSize=100').then((r) => r.json())
      const draft = await fetch('/api/posts?status=draft&pageSize=100').then((r) => r.json())
      const all = [...(published.posts ?? []), ...(draft.posts ?? [])] as AdminPost[]
      setPosts(all)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const onDelete = async (slug: string) => {
    if (!confirm(`确认删除「${slug}」?此操作不可恢复。`)) return
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(await res.text())
      setPosts((prev) => prev.filter((p) => p.slug !== slug))
    } catch (e) {
      alert(`删除失败: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const onUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fileInput = form.querySelector('input[type=file]') as HTMLInputElement
    const file = fileInput.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '上传失败')
      setUploadMsg(`✅ 已收录: ${data.slug}`)
      fileInput.value = ''
      await load()
    } catch (err) {
      setUploadMsg(`❌ ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="pt-24 px-6 max-w-5xl mx-auto pb-20">
      <h1 className="font-orbitron text-4xl font-bold mb-2 neon-text-blue">
        管理后台
      </h1>
      <p className="text-text-secondary mb-8">v1 暂不接入鉴权</p>

      {/* 上传 .md */}
      <section className="mb-12 p-6 rounded-lg border border-neon-blue/30 bg-card-bg">
        <h2 className="text-lg font-bold neon-text-blue mb-4">
          📤 上传 Markdown
        </h2>
        <form onSubmit={onUpload} className="flex gap-3 flex-wrap items-center">
          <input
            type="file"
            accept=".md,text/markdown"
            className="text-sm text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-neon-blue/20 file:text-neon-blue file:cursor-pointer"
          />
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-1.5 rounded border border-neon-blue neon-text-blue hover:bg-neon-blue/10 disabled:opacity-50 text-sm"
          >
            {uploading ? '上传中...' : '上传并收录'}
          </button>
          {uploadMsg && (
            <span className="text-sm text-text-secondary">{uploadMsg}</span>
          )}
        </form>
        <p className="mt-3 text-xs text-text-secondary">
          提示：上传后会自动调用 ingest 流程，移动到{' '}
          <code>content/published/</code> 并入库。也可以直接把 .md 放到{' '}
          <code>content/inbox/</code>，chokidar 会自动监控。
        </p>
      </section>

      {/* 操作区 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          to="/admin/editor"
          className="p-6 rounded-lg border border-neon-purple/30 hover:border-neon-purple transition"
        >
          <h2 className="text-lg font-bold neon-text-purple">✍️ 新建文章</h2>
          <p className="text-sm text-text-secondary mt-2">
            Web 编辑器（双栏实时预览）
          </p>
        </Link>
        <Link
          to="/admin/inbox"
          className="p-6 rounded-lg border border-neon-pink/30 hover:border-neon-pink transition"
        >
          <h2 className="text-lg font-bold neon-text-pink">📁 Inbox 文件</h2>
          <p className="text-sm text-text-secondary mt-2">查看待收录文件</p>
        </Link>
        <Link
          to="/admin/tags"
          className="p-6 rounded-lg border border-neon-blue/30 hover:border-neon-blue transition"
        >
          <h2 className="text-lg font-bold neon-text-blue">🏷️ 标签管理</h2>
          <p className="text-sm text-text-secondary mt-2">
            为标签添加颜色和描述
          </p>
        </Link>
        <Link
          to="/tags"
          className="p-6 rounded-lg border border-neon-green/30 hover:border-neon-green transition"
        >
          <h2 className="text-lg font-bold neon-text-green">📋 查看分类</h2>
          <p className="text-sm text-text-secondary mt-2">前台分类导航</p>
        </Link>
      </div>

      {/* 文章列表 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">📋 文章列表</h2>
          <button
            type="button"
            onClick={() => void load()}
            className="text-sm px-3 py-1 rounded border border-neon-blue/40 hover:border-neon-blue"
          >
            刷新
          </button>
        </div>

        {loading && <p className="text-text-secondary">加载中...</p>}
        {error && (
          <div className="p-3 rounded border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <p className="text-text-secondary text-center py-8">还没有文章</p>
        )}

        <div className="space-y-3">
          {posts.map((p) => (
            <article
              key={p.id}
              className="p-4 rounded border border-neon-blue/20 bg-card-bg flex items-center gap-4 flex-wrap"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/blog/${p.slug}`}
                    className="font-bold hover:neon-text-blue"
                  >
                    {p.title}
                  </Link>
                  <span className="text-xs text-text-secondary font-mono">
                    {p.slug}
                  </span>
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {new Date(p.date).toLocaleDateString('zh-CN')} · 阅读{' '}
                  {p.readingTime ?? '-'} 分钟 · 浏览 {p.viewCount}
                </div>
                {p.tags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-1.5 py-0.5 rounded border border-neon-purple/30"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Link
                  to={`/admin/editor/${encodeURIComponent(p.slug)}`}
                  className="text-xs px-3 py-1 rounded border border-neon-blue/40 hover:border-neon-blue"
                >
                  ✏️ 编辑
                </Link>
                <button
                  type="button"
                  onClick={() => void onDelete(p.slug)}
                  className="text-xs px-3 py-1 rounded border border-red-500/40 text-red-300 hover:border-red-500"
                >
                  🗑️ 删除
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
