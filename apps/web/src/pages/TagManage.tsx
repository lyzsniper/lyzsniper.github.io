import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { TagFull } from '@/lib/api'

const PRESET_COLORS = [
  '#00f5ff', // neon blue
  '#b829dd', // neon purple
  '#ff2d95', // neon pink
  '#39ff14', // neon green
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f97316', // orange
]

export default function TagManage() {
  const [tags, setTags] = useState<TagFull[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ name: string; color: string; description: string }>({
    name: '',
    color: '',
    description: '',
  })
  const [message, setMessage] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/tags/all').then((r) => r.json())
      setTags(r.tags ?? [])
    } catch {
      setTags([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const startEdit = (tag: TagFull) => {
    setEditing(tag.slug)
    setDraft({
      name: tag.name,
      color: tag.color ?? '',
      description: tag.description ?? '',
    })
    setMessage(null)
  }

  const cancelEdit = () => {
    setEditing(null)
    setDraft({ name: '', color: '', description: '' })
  }

  const save = async (slug: string) => {
    try {
      const res = await fetch(`/api/tags/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name,
          color: draft.color || null,
          description: draft.description || null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setMessage(`✅ ${draft.name} 已保存`)
      cancelEdit()
      await load()
    } catch (e) {
      setMessage(`❌ ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-orbitron text-3xl font-bold neon-text-purple">
          🏷️ 标签管理
        </h1>
        <div className="flex gap-2">
          <Link
            to="/admin"
            className="text-sm px-3 py-1 rounded border border-neon-blue/30 text-text-secondary hover:neon-text-blue"
          >
            ← 返回管理
          </Link>
          <Link
            to="/tags"
            className="text-sm px-3 py-1 rounded border border-neon-purple/30 text-text-secondary hover:neon-text-purple"
          >
            前台查看
          </Link>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded border border-neon-blue/30 bg-neon-blue/5 text-sm">
          {message}
        </div>
      )}

      <p className="text-text-secondary text-sm mb-6">
        💡 为标签添加 <strong>描述</strong> 和 <strong>颜色</strong>，会在前台更醒目。
        颜色用 hex（如 <code>#00f5ff</code>），可点击下面预设色快速选择。
      </p>

      {loading && <p className="text-text-secondary">加载中...</p>}

      <div className="space-y-2">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="p-4 rounded border border-neon-purple/20 bg-card-bg"
          >
            {editing === tag.slug ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-text-secondary">名称</span>
                    <input
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 rounded bg-dark-bg border border-neon-blue/30 focus:border-neon-blue outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">颜色</span>
                    <div className="mt-1 flex gap-2 items-center">
                      <input
                        value={draft.color}
                        onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded bg-dark-bg border border-neon-blue/30 focus:border-neon-blue outline-none font-mono text-sm"
                        placeholder="#00f5ff"
                      />
                      <div
                        className="w-8 h-8 rounded border border-neon-blue/30"
                        style={{ background: draft.color || 'transparent' }}
                      />
                    </div>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setDraft({ ...draft, color: c })}
                          className="w-5 h-5 rounded border border-white/20 hover:scale-110 transition"
                          style={{ background: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-text-secondary">描述（可选）</span>
                  <input
                    value={draft.description}
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-1.5 rounded bg-dark-bg border border-neon-blue/30 focus:border-neon-blue outline-none"
                    placeholder="一句话解释这个标签的含义"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void save(tag.slug)}
                    className="px-3 py-1.5 rounded border border-neon-blue neon-text-blue hover:bg-neon-blue/10 text-sm"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-1.5 rounded border border-neon-blue/30 text-text-secondary text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="px-3 py-1 rounded text-sm font-bold"
                  style={{
                    background: tag.color
                      ? `${tag.color}22`
                      : 'rgba(184, 41, 221, 0.1)',
                    color: tag.color ?? 'var(--neon-purple)',
                    border: `1px solid ${tag.color ?? 'var(--neon-purple)'}55`,
                  }}
                >
                  {tag.name}
                </span>
                <span className="text-text-secondary text-sm">
                  {tag.count} 篇文章
                </span>
                {tag.description && (
                  <span className="text-text-secondary text-sm italic">
                    — {tag.description}
                  </span>
                )}
                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(tag)}
                    className="text-xs px-2 py-1 rounded border border-neon-blue/40 hover:border-neon-blue"
                  >
                    ✏️ 编辑
                  </button>
                  <Link
                    to={`/tags/${encodeURIComponent(tag.slug)}`}
                    className="text-xs px-2 py-1 rounded border border-neon-purple/30 text-text-secondary hover:neon-text-purple"
                  >
                    查看
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {tags.length === 0 && !loading && (
        <p className="text-text-secondary text-center py-8">还没有标签</p>
      )}
    </div>
  )
}
