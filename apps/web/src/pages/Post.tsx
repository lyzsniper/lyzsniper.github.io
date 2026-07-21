import { useEffect, useState, useCallback, type ImgHTMLAttributes } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import {
  Download,
  FileText,
  Sun,
  Moon,
  ChevronUp,
  Menu,
  X,
} from 'lucide-react'
import { api, type PostDetail, type TocItem } from '@/lib/api'
import { useHead } from '@/lib/useHead'
import { stripFrontmatter } from '@/lib/frontmatter'
import { useThemeStore } from '@/store/theme'
import { useAuthStore } from '@/store/auth'
import ShareButtons from '@/components/ShareButtons'
import RelatedPosts from '@/components/RelatedPosts'
import CommentSection from '@/components/CommentSection'
import SeriesNav from '@/components/SeriesNav'

/* ------------------------------------------------------------------ */
/* 懒加载图片 <img> 替换                                                 */
/* ------------------------------------------------------------------ */
function LazyImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useCallback((el: HTMLImageElement | null) => {
    if (!el) return
    if ('loading' in HTMLImageElement.prototype) {
      el.loading = 'lazy'
      el.decoding = 'async'
    }
  }, [])
  return <img ref={ref} loading="lazy" decoding="async" {...props} />
}

/* ------------------------------------------------------------------ */
/* 目录组件：观察当前激活的 section + 渲染两份（移动端浮窗 + 桌面端列）               */
/* ------------------------------------------------------------------ */
function useTocObserver(items: TocItem[]) {
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: '-80px 0px -80% 0px' },
    )
    items.forEach((item) => {
      const el = document.getElementById(item.slug)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [items])
  return active
}

/** 渲染一个目录列表（DOM 结构完全一样，给移动/桌面两份副本各用） */
function TocList({
  items,
  active,
  onItemClick,
}: {
  items: TocItem[]
  active: string | null
  onItemClick?: () => void
}) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item.slug}
          style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
        >
          <a
            href={`#${item.slug}`}
            onClick={onItemClick}
            className={`block py-0.5 text-sm transition-colors border-l-2 -ml-[1px] ${
              active === item.slug
                ? 'text-[var(--accent)] border-[var(--accent)] font-medium'
                : 'text-[var(--fg-secondary)] border-transparent hover:text-[var(--fg-primary)] hover:border-[var(--border-default)]'
            }`}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  )
}

/** 移动端：右上角浮动按钮 + 全屏抽屉（独立渲染，不进 grid） */
function TocMobile({ items }: { items: TocItem[] }) {
  const { t } = useTranslation(['common', 'post'])
  const [open, setOpen] = useState(false)
  const active = useTocObserver(items)
  if (items.length === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-20 right-4 z-40 w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-card)',
          color: 'var(--fg-primary)',
        }}
        aria-label={t('post:tocToggle') ?? 'Toggle Table of Contents'}
      >
        {open ? <X size={14} /> : <Menu size={14} />}
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-30" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <aside
            className="absolute right-0 top-0 bottom-0 w-64 overflow-y-auto p-6"
            style={{ backgroundColor: 'var(--bg-default)', borderLeft: '1px solid var(--border-default)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xs font-medium text-[var(--fg-tertiary)] mb-3 uppercase tracking-wider">
              {t('post:toc') ?? 'Table of Contents'}
            </h2>
            <TocList items={items} active={active} onItemClick={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}

/** 桌面端：放在 grid 右侧列，sticky 跟随滚动 */
function TocDesktop({ items }: { items: TocItem[] }) {
  const { t } = useTranslation(['common', 'post'])
  const active = useTocObserver(items)
  if (items.length === 0) return null
  return (
    <aside
      className="hidden lg:block sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto"
      aria-label={t('post:toc') ?? 'Table of Contents'}
    >
      <h2 className="text-xs font-medium text-[var(--fg-tertiary)] mb-3 uppercase tracking-wider">
        {t('post:toc') ?? 'Table of Contents'}
      </h2>
      <TocList items={items} active={active} />
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/* 主组件                                                               */
/* ------------------------------------------------------------------ */
export default function Post() {
  const { t, i18n } = useTranslation(['common', 'post'])
  const { slug = '' } = useParams<{ slug: string }>()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [readProgress, setReadProgress] = useState(0)
  const [showBackTop, setShowBackTop] = useState(false)
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggle)
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    setError(null)
    setPost(null)
    api.getPost(slug).then(setPost).catch((e) => setError(e instanceof Error ? e.message : t('common:error')))
  }, [slug, t])

  const onScroll = useCallback(() => {
    const scrolled = window.scrollY
    const total = document.documentElement.scrollHeight - window.innerHeight
    setReadProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0)
    setShowBackTop(scrolled > 400)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [onScroll])

  // 所有 hooks 必须在 early return 之前调用 —— 防止 "Rendered more hooks" 错误
  const dateLocale = i18n.language?.startsWith('en') ? 'en-US' : 'zh-CN'
  const date = post ? new Date(post.publishedAt).toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : ''
  const absoluteUrl = `${window.location.origin}${window.location.pathname}`
  const isEn = i18n.language?.startsWith('en')
  const enUrl = post ? `/en/blog/${post.slug}` : ''
  const canonical = post ? (isEn ? enUrl : `/blog/${post.slug}`) : ''

  useHead({
    title: post?.title,
    description: post?.summary ?? undefined,
    type: 'article',
    url: absoluteUrl,
    canonical: post ? canonical : '',
    image: post?.coverImage ?? undefined,
    hreflang: post
      ? [
          { lang: 'zh', url: `/blog/${post.slug}` },
          { lang: 'en', url: enUrl },
        ]
      : undefined,
    jsonLd: post
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.summary ?? undefined,
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          author: { '@type': 'Person', name: '刘酝泽', url: window.location.origin },
          publisher: {
            '@type': 'Person',
            name: '刘酝泽',
            logo: { '@type': 'ImageObject', url: `${window.location.origin}/avatar.webp` },
          },
          mainEntityOfPage: absoluteUrl,
          keywords: post.tags.join(', '),
        }
      : undefined,
  })

  if (error) {
    return (
      <div className="container-prose py-20">
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
        <Link to="/blog" className="mt-6 inline-block text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]">
          ← {t('post:backToList')}
        </Link>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container-page py-20 text-center text-sm text-[var(--fg-tertiary)]">
        {t('post:loading')}
      </div>
    )
  }

  return (
    <>
      {/* 阅读进度条 */}
      <div
        className="fixed top-0 left-0 right-0 h-0.5 z-50"
        style={{ backgroundColor: 'var(--border-subtle)' }}
      >
        <div
          className="h-full transition-[width] duration-150"
          style={{ width: `${readProgress}%`, backgroundColor: 'var(--accent)' }}
        />
      </div>

      {/* 移动端：目录浮窗按钮（不进 grid） */}
      <TocMobile items={post.toc} />

      {/* 桌面端：grid 双列布局，正文 9 份 + 右侧 sticky 目录 3 份 */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-6 md:px-10 py-12 md:py-16"
        style={{ width: '100%', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto' }}
      >
        <article className="min-w-0 lg:col-span-9">

        {/* 顶部 */}
        <div className="flex items-center justify-between mb-4">
          <Link to="/blog" className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]">
            ← {t('post:backToList')}
          </Link>
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-sm !w-9 !px-0"
            title={theme === 'dark' ? t('common:theme.switchToLight') : t('common:theme.switchToDark')}
            aria-label={t('common:theme.switchToLight')}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        <header className="mb-10">
          <h1 className="text-display-lg text-[var(--fg-primary)] mb-4 tracking-tight">
            {post.title}
          </h1>
          {post.summary && (
            <p className="text-body-lg text-[var(--fg-secondary)] mb-4 leading-relaxed">
              {post.summary}
            </p>
          )}
          <div className="flex items-center gap-3 text-sm text-[var(--fg-tertiary)] flex-wrap">
            <time className="font-mono">{t('post:publishedOn', { date })}</time>
            {post.readingTime !== null && (
              <>
                <span className="w-1 h-1 rounded-full bg-[var(--fg-quaternary)]" />
                <span>{t('post:readingTime', { minutes: post.readingTime })}</span>
              </>
            )}
            {post.category && (
              <>
                <span className="w-1 h-1 rounded-full bg-[var(--fg-quaternary)]" />
                <span>{post.category}</span>
              </>
            )}
          </div>
          {post.tags.length > 0 && (
            <div className="flex gap-1.5 mt-4 flex-wrap">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/tags/${encodeURIComponent(tag)}`}
                  className="pill hover:!bg-[var(--accent-soft)] hover:!text-[var(--accent)]"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* 正文 */}
        <div
          className="prose"
          style={{ maxWidth: '100%', width: '100%' }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSlug, rehypeHighlight]}
            components={{ img: LazyImage as never }}
          >
            {/* contentMd 可能仍带 YAML frontmatter（脏数据 / inbox 摄入未清理），
                渲染前剥离，避免元数据原文赤裸裸显示在正文顶部 */}
            {stripFrontmatter(post.contentMd ?? '')}
          </ReactMarkdown>
        </div>

        {/* 一键分享 + 操作区 */}
        <div
          className="mt-12 pt-6 space-y-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <ShareButtons url={absoluteUrl} title={post.title} />
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <>
                <a href={api.downloadUrl(post.slug)} className="btn btn-secondary btn-sm">
                  <Download size={13} /> {t('post:downloadMd')}
                </a>
                <a
                  href={api.pdfUrl(post.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  <FileText size={13} /> {t('post:exportPdf')}
                </a>
              </>
            )}
            <Link to="/blog" className="btn btn-ghost btn-sm ml-auto">
              ← {t('post:backToList')}
            </Link>
          </div>
        </div>

        {/* 上下篇（系列导航） */}
        {post.series && (
          <SeriesNav
            currentSlug={post.slug}
            series={post.series}
          />
        )}

        {/* 相关推荐 */}
        <RelatedPosts slug={post.slug} />

        {/* 评论 */}
        <CommentSection postId={post.id} />
      </article>

        {/* 桌面端：右侧 sticky 目录列（3 份 = 25% 宽） */}
        <div className="hidden lg:block lg:col-span-3">
          <TocDesktop items={post.toc} />
        </div>
      </div>

      {/* 返回顶部 */}
      {showBackTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 w-10 h-10 rounded-full flex items-center justify-center z-40"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-card-hover)',
            color: 'var(--fg-secondary)',
          }}
          aria-label={t('post:backToTop')}
        >
          <ChevronUp size={16} strokeWidth={1.75} />
        </button>
      )}
    </>
  )
}
