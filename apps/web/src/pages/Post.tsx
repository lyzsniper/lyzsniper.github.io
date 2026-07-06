import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import { ArrowUp, Download, FileText, Sun, Moon } from 'lucide-react'
import { api, type PostDetail, type TocItem } from '@/lib/api'
import { useThemeStore } from '@/store/theme'
import { useAuthStore } from '@/store/auth'

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

  const dateLocale = i18n.language?.startsWith('en') ? 'en-US' : 'zh-CN'
  const date = new Date(post.publishedAt).toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

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

      <article className="container-prose py-12 md:py-16">
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

        {/* 目录 */}
        {post.toc.length > 0 && <TocNav items={post.toc} />}

        {/* 正文 */}
        <div className="prose">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug, rehypeHighlight]}
          >
            {post.contentMd}
          </ReactMarkdown>
        </div>

        {/* 操作区 */}
        <div
          className="mt-16 pt-6 flex flex-wrap gap-2"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
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
      </article>

      {/* 返回顶部 */}
      {showBackTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 w-10 h-10 rounded-full flex items-center justify-center z-40 transition-all"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-card-hover)',
            color: 'var(--fg-secondary)',
          }}
          aria-label={t('post:backToTop')}
        >
          <ArrowUp size={16} strokeWidth={1.75} />
        </button>
      )}
    </>
  )
}

function TocNav({ items }: { items: TocItem[] }) {
  const { t } = useTranslation(['common', 'post'])
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

  if (items.length === 0) return null

  return (
    <nav
      className="mb-10 rounded-lg p-4"
      style={{
        backgroundColor: 'var(--bg-subtle)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className="text-xs font-medium text-[var(--fg-tertiary)] mb-2 uppercase tracking-wider">{t('post:toc')}</div>
      <ul className="space-y-1 text-sm">
        {items.map((item) => (
          <li key={item.slug} style={{ paddingLeft: `${(item.level - 1) * 12}px` }}>
            <a
              href={`#${item.slug}`}
              className={`block py-0.5 transition-colors ${
                active === item.slug
                  ? 'text-[var(--accent)] font-medium'
                  : 'text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
