import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

interface InboxFile {
  name: string
  size: number
  modified: string
}

export default function Inbox() {
  const [files, setFiles] = useState<InboxFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/inbox')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setFiles(data.files ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败（API 还没实现？）')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [])

  const onIngest = async (filename: string) => {
    try {
      const res = await fetch('/api/inbox/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '收录失败')
      alert(`✅ 已收录: ${data.slug}`)
      await load()
    } catch (e) {
      alert(`❌ ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-20">
      <h1 className="font-orbitron text-3xl font-bold mb-2 neon-text-pink">
        📁 Inbox 文件
      </h1>
      <p className="text-text-secondary mb-8">
        待收录的 .md 文件（chokidar 也会自动处理，5s 刷新一次）
      </p>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => void load()}
          className="px-3 py-1 rounded border border-neon-blue/40 hover:border-neon-blue text-sm"
        >
          刷新
        </button>
        <Link
          to="/admin"
          className="px-3 py-1 rounded border border-neon-blue/30 text-text-secondary hover:neon-text-blue text-sm"
        >
          ← 返回管理
        </Link>
      </div>

      {loading && <p className="text-text-secondary">加载中...</p>}
      {error && (
        <div className="p-3 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-sm mb-4">
          ⚠️ {error}
          <p className="mt-2 text-xs text-text-secondary">
            提示：需要后端补 <code>GET /api/inbox</code> 和{' '}
            <code>POST /api/inbox/ingest</code> 接口。
          </p>
        </div>
      )}

      {!loading && files.length === 0 && !error && (
        <p className="text-text-secondary text-center py-8">Inbox 为空</p>
      )}

      <div className="space-y-2">
        {files.map((f) => (
          <div
            key={f.name}
            className="p-3 rounded border border-neon-pink/20 bg-card-bg flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="font-mono text-sm">{f.name}</div>
              <div className="text-xs text-text-secondary">
                {(f.size / 1024).toFixed(1)} KB · {new Date(f.modified).toLocaleString('zh-CN')}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void onIngest(f.name)}
              className="text-xs px-3 py-1 rounded border border-neon-blue/40 hover:border-neon-blue"
            >
              立即收录
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
