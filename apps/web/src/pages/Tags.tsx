import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Tag as TagIcon, Hash } from 'lucide-react'
import { api, type TagInfo, type PostSummary } from '@/lib/api'
import PostCard from '@/components/PostCard'

export default function Tags() {
  const { t } = useTranslation(['common', 'tags'])
  const { tag } = useParams<{ tag?: string }>()
  const [tags, setTags] = useState<TagInfo[]>([])
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)

  useEffect(() => {
    api.getAllTags().then((r) => setTags(r.tags)).catch(() => setTags([]))
  }, [])

  useEffect(() => {
    if (!tag) {
      setPosts([])
      return
    }
    setLoadingPosts(true)
    api
      .listPosts({ tag, page: 1 })
      .then((r) => setPosts(r.posts))
      .catch(() => setPosts([]))
      .finally(() => setLoadingPosts(false))
  }, [tag])

  const maxCount = Math.max(...tags.map((t) => t.count), 1)
  const tagSize = (count: number) => {
    const ratio = count / maxCount
    if (ratio > 0.75) return 'text-xl font-semibold'
    if (ratio > 0.5) return 'text-lg font-semibold'
    if (ratio > 0.25) return 'text-base'
    return 'text-sm'
  }

  if (tag) {
    const tagInfo = tags.find((t) => t.slug === tag || t.name === tag)
    return (
      <div className="container-page py-12 md:py-16">
        <Link to="/tags" className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] inline-flex items-center gap-1 mb-6">
          ← {t('tags:allTags')}
        </Link>
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
            <Hash size={16} strokeWidth={1.75} />
          </div>
          <h1 className="text-display-md text-[var(--fg-primary)]">
            {tagInfo?.name ?? tag}
          </h1>
          <span className="pill">{t('tags:postsCount', { count: posts.length })}</span>
        </div>

        {tagInfo?.description && (
          <p className="text-body text-[var(--fg-secondary)] max-w-prose mb-8">
            {tagInfo.description}
          </p>
        )}

        {loadingPosts ? (
          <p className="text-sm text-[var(--fg-tertiary)] py-12 text-center">{t('common:loading')}</p>
        ) : posts.length === 0 ? (
          <div className="surface-card p-16 text-center">
            <p className="text-sm text-[var(--fg-secondary)]">{t('tags:noTags')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container-page py-12 md:py-16">
      <div className="eyebrow mb-3">
        <TagIcon size={12} className="text-[var(--accent)]" />
        {t('tags:title')}
      </div>
      <h1 className="text-display-lg text-[var(--fg-primary)] mb-2">{t('tags:title')}</h1>
      <p className="text-sm text-[var(--fg-tertiary)] mb-10">{t('tags:subtitle')}</p>

      {tags.length === 0 ? (
        <div className="surface-card p-16 text-center">
          <p className="text-sm text-[var(--fg-secondary)]">{t('tags:noTags')}</p>
        </div>
      ) : (
        <>
          {/* 标签云 */}
          <div className="flex flex-wrap gap-2 mb-12">
            {tags.map((t) => (
              <Link
                key={t.slug}
                to={`/tags/${encodeURIComponent(t.slug)}`}
                className={`${tagSize(t.count)} px-3 py-1.5 rounded-md transition-colors`}
                style={{
                  backgroundColor: 'var(--bg-muted)',
                  color: 'var(--fg-primary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-soft)'
                  e.currentTarget.style.color = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-muted)'
                  e.currentTarget.style.color = 'var(--fg-primary)'
                }}
              >
                {t.name}
                <span className="ml-1.5 text-xs opacity-50 font-normal">{t.count}</span>
              </Link>
            ))}
          </div>

          {/* 紧凑列表 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {tags.map((t) => (
              <Link
                key={t.slug}
                to={`/tags/${encodeURIComponent(t.slug)}`}
                className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-[var(--bg-muted)] transition-colors group"
              >
                <span className="flex items-center gap-2 min-w-0 text-sm text-[var(--fg-primary)] group-hover:text-[var(--accent)] transition-colors">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: t.color ?? 'var(--accent)' }}
                  />
                  <span className="truncate">{t.name}</span>
                </span>
                <span className="text-xs text-[var(--fg-tertiary)] shrink-0 ml-2">
                  {t.count}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
