import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Inbox as InboxIcon, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface InboxFile {
  name: string
  size: number
  modified: string
}

export default function Inbox() {
  const { t } = useTranslation('inbox')
  const [files, setFiles] = useState<InboxFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ingesting, setIngesting] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>({})

  const showToast = (type: 'ok' | 'err', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/inbox')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setFiles(data.files ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [load])

  const onIngest = async (filename: string) => {
    setIngesting(filename)
    try {
      const tags = tagDrafts[filename]?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
      const res = await fetch('/api/inbox/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ filename, tags: tags.length > 0 ? tags : undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('ingestFailed', { msg: 'ingest' }))
      showToast('ok', t('ingested', { slug: data.slug }))
      setTagDrafts((prev) => {
        const next = { ...prev }
        delete next[filename]
        return next
      })
      await load()
    } catch (e) {
      showToast('err', t('ingestFailed', { msg: e instanceof Error ? e.message : String(e) }))
    } finally {
      setIngesting(null)
    }
  }

  return (
    <div className="container-page py-12 md:py-16">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-2">
        <div>
          <div className="eyebrow mb-2">
            <InboxIcon size={12} className="text-[var(--accent)]" />
            {t('eyebrow')}
          </div>
          <h1 className="text-display-lg text-[var(--fg-primary)]">{t('title')}</h1>
          <p className="text-sm text-[var(--fg-secondary)] mt-2">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void load()} className="btn btn-secondary btn-sm">
            <RefreshCw size={13} /> {t('refresh')}
          </button>
          <Link to="/admin" className="btn btn-ghost btn-sm">
            <ArrowLeft size={13} /> {t('back')}
          </Link>
        </div>
      </div>

      <p className="text-xs text-[var(--fg-tertiary)] mb-8">{t('autoRefresh')}</p>

      {toast && (
        <div
          className="mb-4 px-4 py-2.5 rounded-md text-sm"
          style={{
            backgroundColor: toast.type === 'ok' ? 'var(--accent-soft)' : 'rgba(220, 38, 38, 0.08)',
            color: toast.type === 'ok' ? 'var(--accent)' : '#dc2626',
            border: `1px solid ${toast.type === 'ok' ? 'transparent' : 'rgba(220, 38, 38, 0.16)'}`,
          }}
        >
          {toast.msg}
        </div>
      )}

      {loading && <p className="text-sm text-[var(--fg-tertiary)] py-12 text-center">{t('loading')}</p>}

      {error && (
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
      )}

      {!loading && files.length === 0 && !error && (
        <div
          className="rounded-xl p-16 text-center"
          style={{
            border: '2px dashed var(--border-default)',
            backgroundColor: 'var(--bg-subtle)',
          }}
        >
          <FileText size={32} className="mx-auto mb-3 text-[var(--fg-tertiary)]" strokeWidth={1.5} />
          <p className="text-sm text-[var(--fg-secondary)]">{t('empty')}</p>
          <p className="text-xs text-[var(--fg-tertiary)] mt-1">
            {t('emptyHint')}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {files.map((f) => {
          const isIngesting = ingesting === f.name
          return (
            <div key={f.name} className="surface-card p-4 space-y-3">
              <div className="flex items-center gap-4">
                <FileText size={18} className="text-[var(--fg-tertiary)] shrink-0" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-[var(--fg-primary)] truncate">{f.name}</div>
                  <div className="text-xs text-[var(--fg-tertiary)] mt-0.5 flex items-center gap-3">
                    <span>{(f.size / 1024).toFixed(1)} KB</span>
                    <span>{new Date(f.modified).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void onIngest(f.name)}
                  disabled={isIngesting}
                  className="btn btn-secondary btn-sm shrink-0"
                >
                  {isIngesting ? (
                    <>
                      <span className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                      {t('ingesting')}
                    </>
                  ) : (
                    t('ingest')
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--fg-tertiary)] shrink-0">{t('tagsLabel')}</span>
                <input
                  type="text"
                  value={tagDrafts[f.name] ?? ''}
                  onChange={(e) => setTagDrafts((prev) => ({ ...prev, [f.name]: e.target.value }))}
                  placeholder={t('tagsPlaceholder')}
                  className="input !h-8 !text-xs flex-1"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
