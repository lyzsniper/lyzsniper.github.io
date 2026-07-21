import { Link } from 'react-router-dom'
import type { PostSummary } from '@/lib/api'
import { Clock, Eye, Tag, Folder } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  post: PostSummary
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: (slug: string) => void
}

export default function PostCard({ post, selectable, selected, onToggleSelect }: Props) {
  const { t, i18n } = useTranslation(['common', 'postcard'])
  const date = new Date(post.date).toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <article className="surface-card-interactive glow-card p-5 flex gap-4">
      {selectable && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect?.(post.slug)}
          className="mt-1 w-4 h-4 accent-[var(--accent)] cursor-pointer shrink-0"
          aria-label={`${t('common:select')} ${post.title}`}
        />
      )}

      <div className="flex-1 min-w-0">
        <Link to={`/blog/${post.slug}`} className="block group">
          <h2 className="text-base font-semibold text-[var(--fg-primary)] group-hover:text-[var(--accent)] transition-colors">
            {post.featured && <span className="pill pill-featured !h-5 !text-[10px] mr-2 align-middle">★</span>}
            {post.title}
          </h2>
          {post.summary && (
            <p className="mt-1.5 text-body-sm text-[var(--fg-secondary)] line-clamp-2 leading-relaxed">
              {post.summary}
            </p>
          )}
        </Link>

        <div className="mt-3 flex items-center gap-3 text-xs text-[var(--fg-tertiary)] flex-wrap">
          <time className="font-mono">{date}</time>
          {post.readingTime !== null && (
            <span className="flex items-center gap-1">
              <Clock size={11} strokeWidth={1.75} />
              {t('postcard:minutesAgo', { count: post.readingTime })}
            </span>
          )}
          {(post.viewCount ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Eye size={11} strokeWidth={1.75} />
              {post.viewCount}
            </span>
          )}
          {post.category && (
            <Link
              to={`/blog?category=${encodeURIComponent(post.category)}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-[var(--accent)] transition"
            >
              <Folder size={11} strokeWidth={1.75} />
              {post.category}
            </Link>
          )}
          {post.tags.length > 0 && (
            <div className="flex gap-1 ml-auto flex-wrap">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/tags/${encodeURIComponent(tag)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-0.5 px-2 h-5 rounded text-[11px] bg-[var(--bg-muted)] text-[var(--fg-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition"
                >
                  <Tag size={9} strokeWidth={2} />
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}