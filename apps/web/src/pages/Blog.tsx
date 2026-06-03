import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { api, batchDownload, type PostListResponse, type PostSummary, type CategoryInfo } from '@/lib/api'
import PostCard from '@/components/PostCard'

export default function Blog() {
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState<PostListResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)
  const [categories, setCategories] = useState<CategoryInfo[]>([])

  const page = Number(params.get('page') ?? 1)
  const tag = params.get('tag') ?? undefined
  const category = params.get('category') ?? undefined
  const q = params.get('q') ?? undefined

  useEffect(() => {
    api
      .getCategories()
      .then((r) => setCategories(r.categories))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    setError(null)
    setSelected(new Set())
    api
      .listPosts({ page, tag, category, q })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
  }, [page, tag, category, q])

  const setPage = (p: number) => {
    const next = new URLSearchParams(params)
    next.set('page', String(p))
    setParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleSelect = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const selectAll = () => {
    if (!data) return
    if (selected.size === data.posts.length) setSelected(new Set())
    else setSelected(new Set(data.posts.map((p) => p.slug)))
  }

  const onBatchDownload = async () => {
    if (selected.size === 0) return
    setDownloading(true)
    try {
      await batchDownload(Array.from(selected))
    } catch (e) {
      alert(e instanceof Error ? e.message : '下载失败')
    } finally {
      setDownloading(false)
    }
  }

  const clearFilter = () => {
    setParams(new URLSearchParams())
  }

  // 构建分类树（按顶级分组）
  const topCategories = categories.filter((c) => c.depth === 1)
  const childrenOf = (parent: string) =>
    categories.filter(
      (c) => c.depth > 1 && c.name.startsWith(parent + '/'),
    )

  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-orbitron text-4xl font-bold neon-text-blue">技术博客</h1>
        {data && data.posts.length > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={selectAll}
              className="px-3 py-1 rounded border border-neon-blue/40 hover:border-neon-blue"
            >
              {selected.size === data.posts.length ? '取消全选' : '全选'}
            </button>
            <button
              type="button"
              onClick={onBatchDownload}
              disabled={selected.size === 0 || downloading}
              className="px-3 py-1 rounded border border-neon-pink/50 neon-text-pink hover:bg-neon-pink/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {downloading ? '下载中...' : `📦 打包下载 (${selected.size})`}
            </button>
          </div>
        )}
      </div>

      {/* 分类侧边栏 */}
      {topCategories.length > 0 && (
        <div className="mb-6 p-4 rounded-lg border border-neon-blue/20 bg-card-bg">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="text-sm text-text-secondary shrink-0">📂 分类：</div>
            <div className="flex flex-wrap gap-2 flex-1">
              {topCategories.map((cat) => {
                const children = childrenOf(cat.name)
                const active =
                  category === cat.name ||
                  (category?.startsWith(cat.name + '/') ?? false)
                return (
                  <div
                    key={cat.name}
                    className="flex items-center gap-1 flex-wrap"
                  >
                    <Link
                      to={
                        active
                          ? '/blog'
                          : `/blog?category=${encodeURIComponent(cat.name)}`
                      }
                      className={`text-xs px-2 py-1 rounded border ${
                        active
                          ? 'border-neon-blue neon-text-blue bg-neon-blue/10'
                          : 'border-neon-blue/30 text-text-secondary hover:border-neon-blue'
                      }`}
                    >
                      {cat.name}{' '}
                      <span className="text-text-secondary">({cat.count})</span>
                    </Link>
                    {active &&
                      children.map((c) => (
                        <Link
                          key={c.name}
                          to={`/blog?category=${encodeURIComponent(c.name)}`}
                          className={`text-xs px-2 py-1 rounded border ${
                            category === c.name
                              ? 'border-neon-purple neon-text-purple bg-neon-purple/10'
                              : 'border-neon-purple/30 text-text-secondary hover:border-neon-purple'
                          }`}
                        >
                          {c.name.split('/').pop()} ({c.count})
                        </Link>
                      ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {(tag || category || q) && (
        <div className="mb-6 flex items-center gap-2 text-sm flex-wrap">
          <span className="text-text-secondary">当前过滤：</span>
          {category && (
            <span className="px-2 py-0.5 rounded border border-neon-blue/40">
              分类: {category}
            </span>
          )}
          {tag && (
            <span className="px-2 py-0.5 rounded border border-neon-purple/40">
              标签: {tag}
            </span>
          )}
          {q && (
            <span className="px-2 py-0.5 rounded border border-neon-blue/40">
              搜索: {q}
            </span>
          )}
          <button
            type="button"
            onClick={clearFilter}
            className="ml-2 text-text-secondary hover:neon-text-blue"
          >
            ✕ 清除
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded border border-red-500/30 bg-red-500/10 text-red-300 mb-6">
          ⚠️ {error}
        </div>
      )}

      {data && data.posts.length === 0 && (
        <p className="text-text-secondary text-center py-12">
          {category || tag || q ? '没有匹配的文章' : '还没有博客文章'}
        </p>
      )}

      {data && (
        <div className="space-y-6">
          {data.posts.map((post: PostSummary) => (
            <PostCard
              key={post.id}
              post={post}
              selectable
              selected={selected.has(post.slug)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8 flex-wrap">
          {Array.from({ length: data.totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded border ${
                page === i + 1
                  ? 'border-neon-blue neon-text-blue'
                  : 'border-neon-blue/30 text-text-secondary'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link to="/" className="text-text-secondary hover:neon-text-blue">
          ← 返回首页
        </Link>
      </div>
    </div>
  )
}
