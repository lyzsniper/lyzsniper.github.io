import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { api, type PostSummary } from '@/lib/api'

interface Props {
  currentSlug: string
  series: string
}

export default function SeriesNav({ currentSlug, series }: Props) {
  const { t } = useTranslation(['common', 'post'])
  const [seriesPosts, setSeriesPosts] = useState<PostSummary[]>([])

  useEffect(() => {
    api
      .listPosts({}) // 拿全部
      .then((r) => {
        const filtered = r.posts.filter((p) => p.series === series)
        filtered.sort((a, b) => (a.seriesOrder ?? 999) - (b.seriesOrder ?? 999))
        setSeriesPosts(filtered)
      })
      .catch(() => setSeriesPosts([]))
  }, [series])

  if (seriesPosts.length <= 1) return null

  const currentIndex = seriesPosts.findIndex((p) => p.slug === currentSlug)
  const prev = currentIndex > 0 ? seriesPosts[currentIndex - 1] : null
  const next = currentIndex >= 0 && currentIndex < seriesPosts.length - 1 ? seriesPosts[currentIndex + 1] : null
  const total = seriesPosts.length

  return (
    <section
      className="mt-16 pt-6"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
      aria-label={t('post:series') ?? 'Series'}
    >
      <div className="surface-card p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={14} className="text-[var(--accent)]" />
          <h2 className="text-sm font-medium text-[var(--fg-primary)]">
            {series} <span className="text-[var(--fg-tertiary)] font-normal">· {t('post:seriesProgress', { current: currentIndex + 1, total }) ?? `第 ${currentIndex + 1}/${total} 篇`}</span>
          </h2>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-default)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${total > 0 ? ((currentIndex + 1) / total) * 100 : 0}%`,
              backgroundColor: 'var(--accent)',
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {prev ? (
          <Link
            to={`/blog/${prev.slug}`}
            className="surface-card-interactive p-4 group"
          >
            <span className="text-xs text-[var(--fg-tertiary)] flex items-center gap-1 mb-1">
              <ChevronLeft size={12} />
              {t('post:prevPost') ?? '上一篇'}
            </span>
            <span className="text-sm font-medium text-[var(--fg-primary)] group-hover:text-[var(--accent)] transition-colors">
              {prev.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            to={`/blog/${next.slug}`}
            className="surface-card-interactive p-4 group text-right"
          >
            <span className="text-xs text-[var(--fg-tertiary)] flex items-center gap-1 mb-1 justify-end">
              {t('post:nextPost') ?? '下一篇'}
              <ChevronRight size={12} />
            </span>
            <span className="text-sm font-medium text-[var(--fg-primary)] group-hover:text-[var(--accent)] transition-colors">
              {next.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </section>
  )
}
