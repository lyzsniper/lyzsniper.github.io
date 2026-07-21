import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, Eye, ArrowRight } from 'lucide-react'
import type { PostSummary } from '@/lib/api'
import GenCover from '@/components/GenCover'
import { categoryVisual } from '@/lib/categoryColor'

/**
 * FeaturedPosts — 博客页精选区（仅无过滤第 1 页渲染）。
 * 1 张主卡 + 最多 2 张次精选卡；封面优先用 coverImage，
 * 无封面时用 GenCover 生成（分类 → 色相/图案，零图片素材）。
 */

function Meta({ post, className }: { post: PostSummary; className?: string }) {
  const { t, i18n } = useTranslation(['postcard'])
  const date = new Date(post.date).toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  return (
    <div className={`flex items-center gap-3 text-xs text-[var(--fg-tertiary)] flex-wrap ${className ?? ''}`}>
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
    </div>
  )
}

function CategoryPill({ category }: { category: string }) {
  const { color } = categoryVisual(category)
  return (
    <span className="pill" style={{ ['--cc' as string]: color }}>
      <span className="cat-dot" />
      {category}
    </span>
  )
}

function Cover({ post, pattern }: { post: PostSummary; pattern?: 'constellation' | 'waves' | 'orbits' }) {
  if (post.coverImage) {
    return (
      <img
        src={post.coverImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
    )
  }
  return <GenCover category={post.category} seed={post.slug} pattern={pattern} />
}

export default function FeaturedPosts({ posts }: { posts: PostSummary[] }) {
  const { t } = useTranslation(['blog'])
  if (posts.length === 0) return null
  const [main, ...picks] = posts

  return (
    <section aria-label={t('blog:featured')} className="mb-10">
      {/* 主卡 */}
      <Link
        to={`/blog/${main.slug}`}
        className="glow-card surface-card group grid grid-cols-1 md:grid-cols-[1.15fr_1fr] overflow-hidden !rounded-3xl mb-4 transition-transform duration-500 hover:-translate-y-0.5"
        style={{ textDecoration: 'none' }}
      >
        <div className="p-8 md:p-11 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <span className="pill pill-featured">★ {t('blog:featured')}</span>
            {main.category && <CategoryPill category={main.category} />}
          </div>
          <h2 className="text-2xl md:text-[32px] leading-snug font-bold tracking-tight text-[var(--fg-primary)] group-hover:text-[var(--accent)] transition-colors">
            {main.title}
          </h2>
          {main.summary && (
            <p className="mt-3 text-sm text-[var(--fg-secondary)] leading-relaxed line-clamp-2">
              {main.summary}
            </p>
          )}
          <Meta post={main} className="mt-5" />
          <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)]">
            {t('blog:readMore')}
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
        <div className="relative min-h-[220px] overflow-hidden">
          <Cover post={main} pattern="constellation" />
        </div>
      </Link>

      {/* 次精选（最多 2 张） */}
      {picks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {picks.slice(0, 2).map((p) => (
            <Link
              key={p.slug}
              to={`/blog/${p.slug}`}
              className="glow-card surface-card group flex gap-5 p-6 !rounded-2xl transition-transform duration-500 hover:-translate-y-0.5"
              style={{ textDecoration: 'none' }}
            >
              <div className="relative shrink-0 w-[108px] h-[108px] rounded-xl overflow-hidden self-center">
                <Cover post={p} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="pill pill-accent">{t('blog:featured')}</span>
                  {p.category && <CategoryPill category={p.category} />}
                </div>
                <h3 className="text-base font-semibold leading-snug tracking-tight text-[var(--fg-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                  {p.title}
                </h3>
                <Meta post={p} className="mt-2" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
