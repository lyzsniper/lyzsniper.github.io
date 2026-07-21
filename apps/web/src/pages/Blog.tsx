import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, PackageOpen, X, FileText } from 'lucide-react'
import { api, batchDownload, type PostListResponse, type PostSummary, type CategoryInfo } from '@/lib/api'
import PostCard from '@/components/PostCard'
import { useAuthStore } from '@/store/auth'

export default function Blog() {
  const { t } = useTranslation(['common', 'blog'])
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState<PostListResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [searchInput, setSearchInput] = useState('')

  const page = Number(params.get('page') ?? 1)
  const tag = params.get('tag') ?? undefined
  const category = params.get('category') ?? undefined
  const q = params.get('q') ?? undefined

  useEffect(() => {
    setSearchInput(q ?? '')
  }, [q])

  useEffect(() => {
    api.getCategories().then((r) => setCategories(r.categories)).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    setError(null)
    setSelected(new Set())
    api
      .listPosts({ page, tag, category, q })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : t('blog:loadFailed')))
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
      alert(e instanceof Error ? e.message : t('blog:downloadFailed'))
    } finally {
      setDownloading(false)
    }
  }

  const clearFilter = () => {
    setParams(new URLSearchParams())
    setSearchInput('')
  }

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const next = new URLSearchParams(params)
    if (searchInput.trim()) next.set('q', searchInput.trim())
    else next.delete('q')
    next.delete('page')
    setParams(next)
  }

  const topCategories = useMemo(() => categories.filter((c) => c.depth === 1), [categories])
  const childrenOf = (parent: string) =>
    categories.filter((c) => c.depth > 1 && c.name.startsWith(parent + '/'))

  const totalPosts = data?.total ?? 0
  const hasFilter = !!(category || tag || q)

  return (
    <div className="container-page py-12 md:py-16">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="eyebrow mb-2">
            <FileText size={12} className="text-[var(--accent)]" />
            {t('blog:title')}
          </div>
          <h1 className="text-display-lg text-[var(--fg-primary)]">{t('blog:subtitle')}</h1>
          {totalPosts > 0 && (
            <p className="text-sm text-[var(--fg-tertiary)] mt-2">
              {t('blog:totalPosts', { count: totalPosts })}
            </p>
          )}
        </div>
        {isAdmin && data && data.posts.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={selectAll} className="btn btn-secondary btn-sm">
              {selected.size === data.posts.length ? t('blog:deselectAll') : t('blog:selectAll')}
            </button>
            <button
              onClick={() => void onBatchDownload()}
              disabled={selected.size === 0 || downloading}
              className="btn btn-secondary btn-sm"
            >
              <PackageOpen size={13} />
              {downloading ? t('blog:packing') : t('blog.download', { count: selected.size })}
            </button>
          </div>
        )}
      </div>

      {/* 搜索 */}
      <form onSubmit={onSearch} className="mb-6">
        <div className="relative">
          <Search
            size={14}
            strokeWidth={1.75}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)] pointer-events-none"
          />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('blog:searchPlaceholder')}
            className="input !pl-9"
          />
        </div>
      </form>

      {/* 分类树 */}
      {topCategories.length > 0 && (
        <div className="mb-6 flex items-start gap-3 flex-wrap">
          <span className="text-xs text-[var(--fg-tertiary)] pt-1.5 shrink-0">{t('blog:category')}</span>
          <div className="flex flex-wrap gap-1.5">
            {topCategories.map((cat) => {
              const children = childrenOf(cat.name)
              const active = category === cat.name || (category?.startsWith(cat.name + '/') ?? false)
              return (
                <div key={cat.name} className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    to={active ? '/blog' : `/blog?category=${encodeURIComponent(cat.name)}`}
                    className={`pill ${active ? 'pill-accent' : ''}`}
                  >
                    {cat.name.split('/').pop()} <span className="opacity-60">{cat.count}</span>
                  </Link>
                  {active &&
                    children.map((c) => (
                      <Link
                        key={c.name}
                        to={`/blog?category=${encodeURIComponent(c.name)}`}
                        className={`pill ${category === c.name ? 'pill-accent' : ''}`}
                      >
                        {c.name.split('/').pop()} <span className="opacity-60">{c.count}</span>
                      </Link>
                    ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 过滤标签 */}
      {hasFilter && (
        <div className="mb-6 flex items-center gap-2 text-sm flex-wrap">
          <span className="text-xs text-[var(--fg-tertiary)]">{t('blog:filter')}</span>
          {category && <span className="pill pill-accent">{category}</span>}
          {tag && <span className="pill pill-accent">#{tag}</span>}
          {q && <span className="pill pill-accent">"{q}"</span>}
          <button onClick={clearFilter} className="btn btn-ghost btn-sm !h-6 !px-2 !text-xs">
            <X size={12} /> {t('blog:clear')}
          </button>
        </div>
      )}

      {error && (
        <div
          className="mb-6 px-4 py-3 rounded-md text-sm"
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.08)',
            color: '#dc2626',
            border: '1px solid rgba(220, 38, 38, 0.16)',
          }}
        >
          {error}
        </div>
      )}

      {/* 文章列表 */}
      {data && data.posts.length === 0 && (
        <div className="surface-card p-16 text-center">
          <p className="text-sm text-[var(--fg-secondary)]">
            {hasFilter ? t('blog:emptySearch') : t('blog:noPosts')}
          </p>
        </div>
      )}

      {data && data.posts.length > 0 && (
        <div className="space-y-3">
          {data.posts.map((post: PostSummary) => (
            <PostCard key={post.id} post={post} selectable selected={selected.has(post.slug)} onToggleSelect={toggleSelect} />
          ))}
        </div>
      )}

      {/* 分页 */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-10 flex-wrap">
          {Array.from({ length: data.totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i + 1)}
              className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}