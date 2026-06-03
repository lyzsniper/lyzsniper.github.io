import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, type PostSummary } from '@/lib/api'
import PostCard from '@/components/PostCard'

export default function Search() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [results, setResults] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const query = params.get('q')?.trim()
    if (!query) {
      setResults([])
      return
    }
    setLoading(true)
    api
      .search(query)
      .then((r) => setResults(r.results))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [params])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = q.trim()
    if (!trimmed) return
    setParams(trimmed ? { q: trimmed } : {})
  }

  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-20">
      <h1 className="font-orbitron text-4xl font-bold mb-8 neon-text-blue">搜索</h1>
      <form onSubmit={onSubmit} className="flex gap-2 mb-8">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索博客标题、内容、标签..."
          className="flex-1 px-4 py-2 rounded bg-card-bg border border-neon-blue/30 focus:border-neon-blue outline-none"
        />
        <button
          type="submit"
          className="px-6 py-2 rounded border border-neon-blue neon-text-blue hover:bg-neon-blue/10"
        >
          搜索
        </button>
      </form>

      {loading && <p className="text-text-secondary">搜索中...</p>}

      {!loading && params.get('q') && results.length === 0 && (
        <p className="text-text-secondary text-center py-8">暂无结果</p>
      )}

      <div className="space-y-6">
        {results.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>

      <div className="mt-8">
        <Link to="/" className="text-text-secondary hover:neon-text-blue">
          ← 首页
        </Link>
      </div>
    </div>
  )
}
