import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, type TagInfo } from '@/lib/api'

export default function Tags() {
  const { tag } = useParams<{ tag?: string }>()
  const [tags, setTags] = useState<TagInfo[]>([])

  useEffect(() => {
    api
      .getTags()
      .then((r) => setTags(r.tags))
      .catch(() => setTags([]))
  }, [])

  if (tag) {
    return (
      <div className="pt-24 px-6 max-w-4xl mx-auto pb-20">
        <h1 className="font-orbitron text-3xl font-bold mb-2 neon-text-blue">
          #{tag}
        </h1>
        <p className="text-text-secondary mb-8">该标签下的文章</p>
        <Link to="/blog" className="text-neon-purple hover:underline">
          ← 返回列表
        </Link>
      </div>
    )
  }

  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-20">
      <h1 className="font-orbitron text-4xl font-bold mb-8 neon-text-blue">标签</h1>
      {tags.length === 0 ? (
        <p className="text-text-secondary">还没有标签</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((t) => (
            <Link
              key={t.slug}
              to={`/tags/${encodeURIComponent(t.slug)}`}
              className="px-4 py-2 rounded-lg border border-neon-purple/30 hover:border-neon-purple"
            >
              {t.name}{' '}
              <span className="text-text-secondary">({t.count})</span>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-8">
        <Link to="/" className="text-text-secondary hover:neon-text-blue">
          ← 首页
        </Link>
      </div>
    </div>
  )
}
