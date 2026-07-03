import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search, Tags as TagsIcon, Eye } from 'lucide-react'
import type { TagFull } from '@/lib/api'

const PRESET_COLORS = [
  '#4f46e5',
  '#7c3aed',
  '#db2777',
  '#059669',
  '#d97706',
  '#dc2626',
  '#2563eb',
  '#10b981',
  '#8b5cf6',
  '#f97316',
]

export default function TagManage() {
  const [tags, setTags] = useState<TagFull[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ name: string; color: string; description: string }>({
    name: '',
    color: '',
    description: '',
  })
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tags/all')
      const r = await res.json()
      setTags(r.tags ?? [])
    } catch {
      setTags([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

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
        credentials: 'include',
        body: JSON.stringify({
          name: draft.name,
          color: draft.color || null,
          description: draft.description || null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setMessage(`${draft.name} 已保存`)
      cancelEdit()
      await load()
    } catch (e) {
      setMessage(`失败: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const filtered = tags.filter((t) => !filter || t.name.toLowerCase().includes(filter.toLowerCase()))

  return (
    <div className="container-page py-12 md:py-16">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-2">
        <div>
          <div className="eyebrow mb-2">
            <TagsIcon size={12} className="text-[var(--accent)]" />
            标签管理
          </div>
          <h1 className="text-display-lg text-[var(--fg-primary)]">标签</h1>
          <p className="text-sm text-[var(--fg-secondary)] mt-2">
            为标签添加描述和颜色，会在前台更醒目。
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin" className="btn btn-ghost btn-sm">
            <ArrowLeft size={13} /> 返回管理
          </Link>
          <Link to="/tags" className="btn btn-secondary btn-sm">
            <Eye size={13} /> 前台查看
          </Link>
        </div>
      </div>

      {message && (
        <div
          className="mt-6 mb-2 px-3 py-2 rounded-md text-sm"
          style={{
            backgroundColor: 'var(--bg-muted)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {message}
        </div>
      )}

      <div className="relative my-6">
        <Search
          size={14}
          strokeWidth={1.75}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)] pointer-events-none"
        />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="搜索标签…"
          className="input !pl-9"
        />
      </div>

      {!loading && (
        <p className="text-xs text-[var(--fg-tertiary)] mb-4">
          {tags.length} 个标签{filter && ` · 匹配 ${filtered.length} 个`}
        </p>
      )}

      {loading && <p className="text-sm text-[var(--fg-tertiary)] py-12 text-center">加载中…</p>}

      <div className="space-y-2">
        {filtered.map((tag) => (
          <div key={tag.id} className="surface-card p-4">
            {editing === tag.slug ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-medium text-[var(--fg-secondary)] mb-1.5 block">名称</span>
                    <input
                      className="input"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-[var(--fg-secondary)] mb-1.5 block">颜色</span>
                    <div className="flex gap-2 items-center">
                      <input
                        className="input font-mono flex-1"
                        value={draft.color}
                        onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                        placeholder="#4f46e5"
                      />
                      <div
                        className="w-9 h-9 rounded-md shrink-0"
                        style={{
                          background: draft.color || 'transparent',
                          border: '1px solid var(--border-default)',
                        }}
                      />
                    </div>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setDraft({ ...draft, color: c })}
                          className="w-5 h-5 rounded hover:scale-110 transition-transform"
                          style={{ background: c, border: '1px solid rgba(255,255,255,0.1)' }}
                          title={c}
                        />
                      ))}
                    </div>
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs font-medium text-[var(--fg-secondary)] mb-1.5 block">描述（可选）</span>
                  <input
                    className="input"
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    placeholder="一句话解释这个标签的含义"
                  />
                </label>
                <div className="flex gap-2">
                  <button onClick={() => void save(tag.slug)} className="btn btn-primary btn-sm">
                    保存
                  </button>
                  <button onClick={cancelEdit} className="btn btn-secondary btn-sm">
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="px-3 h-7 inline-flex items-center rounded-md text-sm font-medium"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}15` : 'var(--bg-muted)',
                    color: tag.color ?? 'var(--fg-primary)',
                    border: `1px solid ${tag.color ?? 'var(--border-subtle)'}`,
                  }}
                >
                  {tag.name}
                </span>
                <span className="text-xs text-[var(--fg-tertiary)]">
                  {tag.count} 篇
                </span>
                {tag.description && (
                  <span className="text-xs text-[var(--fg-secondary)] italic">— {tag.description}</span>
                )}
                <div className="ml-auto flex gap-2">
                  <button onClick={() => startEdit(tag)} className="btn btn-ghost btn-sm">
                    编辑
                  </button>
                  <Link
                    to={`/tags/${encodeURIComponent(tag.slug)}`}
                    className="btn btn-ghost btn-sm"
                  >
                    查看
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="surface-card p-16 text-center">
          <p className="text-sm text-[var(--fg-secondary)]">
            {filter ? '没有匹配的标签' : '还没有标签'}
          </p>
        </div>
      )}
    </div>
  )
}