import { Link } from 'react-router-dom'
import type { PostSummary } from '@/lib/api'

interface Props {
  post: PostSummary
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: (slug: string) => void
}

export default function PostCard({ post, selectable, selected, onToggleSelect }: Props) {
  const date = new Date(post.date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <article className="group p-6 rounded-lg border border-neon-blue/20 bg-card-bg hover:border-neon-blue/50 transition flex gap-4">
      {selectable && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect?.(post.slug)}
          className="mt-1 w-4 h-4 accent-neon-blue"
          aria-label={`选择 ${post.title}`}
        />
      )}

      <div className="flex-1 min-w-0">
        <Link to={`/blog/${post.slug}`} className="block">
          <h2 className="text-xl font-bold group-hover:neon-text-blue transition">
            {post.title}
          </h2>
          {post.summary && (
            <p className="mt-2 text-text-secondary line-clamp-2">{post.summary}</p>
          )}
        </Link>

        <div className="mt-4 flex items-center gap-3 text-sm text-text-secondary flex-wrap">
          <time>{date}</time>
          {post.readingTime !== null && <span>· {post.readingTime} 分钟</span>}
          {post.category && (
            <Link
              to={`/blog?category=${encodeURIComponent(post.category)}`}
              onClick={(e) => e.stopPropagation()}
              className="px-2 py-0.5 rounded border border-neon-blue/40 text-xs hover:border-neon-blue"
            >
              📂 {post.category}
            </Link>
          )}
          {post.tags.length > 0 && (
            <div className="flex gap-2 ml-auto flex-wrap">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/tags/${encodeURIComponent(tag)}`}
                  className="px-2 py-0.5 rounded border border-neon-purple/30 hover:border-neon-purple text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
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
