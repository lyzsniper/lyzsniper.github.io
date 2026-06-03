import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import { api, type PostDetail, type TocItem } from '@/lib/api'

type ReadMode = 'dark' | 'light'
const STORAGE_KEY = 'blog:read-mode'

export default function Post() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<ReadMode>('dark')

  useEffect(() => {
    // 加载用户的阅读偏好
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'light' || saved === 'dark') setMode(saved)
    } catch {
      // localStorage 可能不可用（隐私模式等）
    }
  }, [])

  useEffect(() => {
    setError(null)
    setPost(null)
    api
      .getPost(slug)
      .then(setPost)
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
  }, [slug])

  const toggleMode = () => {
    const next: ReadMode = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }

  if (error) {
    return (
      <div className="pt-24 px-6 max-w-3xl mx-auto">
        <div className="p-4 rounded border border-red-500/30 bg-red-500/10 text-red-300">
          ⚠️ {error}
        </div>
        <Link
          to="/blog"
          className="mt-4 inline-block text-neon-blue hover:underline"
        >
          ← 返回列表
        </Link>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="pt-24 px-6 text-center text-text-secondary">加载中...</div>
    )
  }

  const isLight = mode === 'light'

  return (
    <article className="pt-24 px-6 max-w-3xl mx-auto pb-20">
      <header className="mb-8 pb-6 border-b border-neon-blue/20">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="font-orbitron text-4xl font-bold mb-3 neon-text-blue">
              {post.title}
            </h1>
            <div className="flex gap-3 text-sm text-text-secondary flex-wrap">
              <time>
                {new Date(post.publishedAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              {post.readingTime !== null && <span>· {post.readingTime} 分钟阅读</span>}
            </div>
            {post.tags.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/tags/${encodeURIComponent(tag)}`}
                    className="text-xs px-2 py-0.5 rounded border border-neon-purple/30 hover:border-neon-purple"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 阅读模式切换 */}
          <button
            type="button"
            onClick={toggleMode}
            title={isLight ? '切换到 neon 暗色' : '切换到白底阅读'}
            className={`shrink-0 px-3 py-1.5 rounded text-sm border transition flex items-center gap-2 ${
              isLight
                ? 'bg-white text-gray-900 border-gray-300 hover:border-blue-500'
                : 'border-neon-blue/40 text-neon-blue hover:bg-neon-blue/10'
            }`}
          >
            {isLight ? '🌞 白底' : '🌙 neon'}
          </button>
        </div>
      </header>

      {post.toc.length > 0 && <TocNav items={post.toc} mode={mode} />}

      {/* 渲染容器：light 模式用 prose-light，dark 模式用 prose */}
      {isLight ? (
        <div className="prose-light">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug, rehypeHighlight]}
          >
            {post.contentMd}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug, rehypeHighlight]}
          >
            {post.contentMd}
          </ReactMarkdown>
        </div>
      )}

      <div className="mt-12 pt-6 border-t border-neon-blue/20 flex gap-4 flex-wrap">
        <a
          href={api.downloadUrl(post.slug)}
          className="px-4 py-2 rounded border border-neon-blue/50 hover:bg-neon-blue/10 text-sm"
        >
          📥 下载 .md
        </a>
        <a
          href={api.pdfUrl(post.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded border border-neon-pink/50 hover:bg-neon-pink/10 text-sm"
        >
          📄 导出 PDF
        </a>
        <Link
          to="/blog"
          className="ml-auto px-4 py-2 rounded border border-neon-blue/30 text-sm text-text-secondary hover:neon-text-blue"
        >
          ← 返回列表
        </Link>
      </div>
    </article>
  )
}

function TocNav({ items, mode }: { items: TocItem[]; mode: ReadMode }) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id)
          }
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

  const isLight = mode === 'light'

  return (
    <nav
      className={`mb-8 p-4 rounded-lg ${
        isLight
          ? 'bg-gray-50 border border-gray-200'
          : 'border border-neon-purple/20 bg-card-bg'
      }`}
    >
      <div className={`text-xs mb-2 ${isLight ? 'text-gray-500' : 'text-text-secondary'}`}>
        目录
      </div>
      <ul className="space-y-1 text-sm">
        {items.map((item) => (
          <li
            key={item.slug}
            style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
          >
            <a
              href={`#${item.slug}`}
              className={
                isLight
                  ? active === item.slug
                    ? 'text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-blue-600'
                  : active === item.slug
                    ? 'neon-text-blue'
                    : 'text-text-secondary hover:neon-text-purple'
              }
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
