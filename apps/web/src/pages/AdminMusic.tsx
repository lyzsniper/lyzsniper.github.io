import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Music2, Plus, Trash2, Upload, Pencil, Check, X, ChevronDown, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { api, type AlbumInfo } from '@/lib/api'

/**
 * AdminMusic — 音乐管理：建专辑、编辑介绍、上传曲目（音频 + 元信息）、删除。
 */

const TYPE_OPTIONS: { value: AlbumInfo['type']; label: string }[] = [
  { value: 'album', label: '专辑' },
  { value: 'ep', label: 'EP' },
  { value: 'single', label: '单曲' },
]

function readDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const el = new Audio()
    el.preload = 'metadata'
    el.onloadedmetadata = () => {
      const d = Number.isFinite(el.duration) ? el.duration : undefined
      URL.revokeObjectURL(url)
      resolve(d)
    }
    el.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(undefined)
    }
    el.src = url
  })
}

export default function AdminMusic() {
  const { t } = useTranslation(['adminmusic'])
  const [albums, setAlbums] = useState<AlbumInfo[]>([])
  const [error, setError] = useState<string | null>(null)

  // 新建专辑表单
  const [title, setTitle] = useState('')
  const [type, setType] = useState<AlbumInfo['type']>('album')
  const [year, setYear] = useState<string>(String(new Date().getFullYear()))
  const [hue, setHue] = useState(242)
  const [desc, setDesc] = useState('')
  const [creating, setCreating] = useState(false)

  // 展开的专辑 / 编辑介绍
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingDesc, setEditingDesc] = useState<string | null>(null)
  const [descDraft, setDescDraft] = useState('')

  // 上传状态（per album）
  const [uploading, setUploading] = useState<string | null>(null)
  const [coverUploading, setCoverUploading] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const coverRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const load = useCallback(async () => {
    try {
      const r = await api.listAlbums()
      setAlbums(r.albums)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'load failed')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)
    setError(null)
    try {
      await api.createAlbum({
        title: title.trim(),
        type,
        year: year ? Number(year) : undefined,
        hue,
        description: desc.trim() || undefined,
      })
      setTitle('')
      setDesc('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'create failed')
    } finally {
      setCreating(false)
    }
  }

  const onDeleteAlbum = async (slug: string) => {
    if (!confirm(t('adminmusic:deleteAlbumConfirm', { slug }))) return
    await api.deleteAlbum(slug)
    await load()
  }

  const onSaveDesc = async (slug: string) => {
    await api.updateAlbum(slug, { description: descDraft })
    setEditingDesc(null)
    await load()
  }

  const onUploadTrack = async (al: AlbumInfo, file: File) => {
    setUploading(al.slug)
    setError(null)
    try {
      const duration = await readDuration(file)
      const trackTitle = file.name.replace(/\.[^.]+$/, '')
      await api.uploadTrack(al.slug, { file, title: trackTitle, duration })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'upload failed')
    } finally {
      setUploading(null)
      const ref = fileRefs.current[al.slug]
      if (ref) ref.value = ''
    }
  }

  const onDeleteTrack = async (id: number) => {
    await api.deleteTrack(id)
    await load()
  }

  const onUploadCover = async (al: AlbumInfo, file: File) => {
    setCoverUploading(al.slug)
    setError(null)
    try {
      await api.uploadAlbumCover(al.slug, file)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'cover upload failed')
    } finally {
      setCoverUploading(null)
      const ref = coverRefs.current[al.slug]
      if (ref) ref.value = ''
    }
  }

  return (
    <div className="container-page py-12 md:py-16">
      <div className="eyebrow mb-2">
        <Music2 size={12} className="text-[var(--accent)]" />
        {t('adminmusic:eyebrow')}
      </div>
      <h1 className="text-display-lg text-[var(--fg-primary)] mb-8">{t('adminmusic:title')}</h1>

      {error && (
        <div
          className="mb-6 px-4 py-3 rounded-md text-sm"
          style={{ backgroundColor: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.16)' }}
        >
          {error}
        </div>
      )}

      {/* ===== 新建专辑 ===== */}
      <section className="surface-card p-6 mb-10">
        <h2 className="text-base font-semibold text-[var(--fg-primary)] mb-4 flex items-center gap-2">
          <Plus size={15} className="text-[var(--accent)]" /> {t('adminmusic:createTitle')}
        </h2>
        <form onSubmit={(e) => void onCreate(e)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-[var(--fg-tertiary)]">{t('adminmusic:fieldTitle')}</span>
            <input className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs text-[var(--fg-tertiary)]">{t('adminmusic:fieldType')}</span>
              <select className="input mt-1" value={type} onChange={(e) => setType(e.target.value as AlbumInfo['type'])}>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-[var(--fg-tertiary)]">{t('adminmusic:fieldYear')}</span>
              <input className="input mt-1" value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" />
            </label>
            <label className="block">
              <span className="text-xs text-[var(--fg-tertiary)]">{t('adminmusic:fieldHue')}</span>
              <input
                type="number"
                className="input mt-1"
                value={hue}
                min={0}
                max={360}
                onChange={(e) => setHue(Number(e.target.value))}
              />
            </label>
          </div>
          <label className="block md:col-span-2">
            <span className="text-xs text-[var(--fg-tertiary)]">{t('adminmusic:fieldDesc')}</span>
            <textarea
              className="input mt-1 !h-24 py-2"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={t('adminmusic:descPlaceholder')}
            />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="btn btn-primary" disabled={creating || !title.trim()}>
              <Plus size={14} /> {creating ? t('adminmusic:creating') : t('adminmusic:create')}
            </button>
          </div>
        </form>
      </section>

      {/* ===== 专辑列表 ===== */}
      <section className="space-y-3">
        {albums.map((al) => {
          const isOpen = expanded === al.slug
          return (
            <article key={al.slug} className="surface-card p-5">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setExpanded(isOpen ? null : al.slug)}
                  className="text-[var(--fg-tertiary)]"
                  aria-label="toggle"
                >
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <span className="w-4 h-4 rounded" style={{ backgroundColor: `hsl(${al.hue} 48% 40%)` }} />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-[var(--fg-primary)]">{al.title}</span>
                  <span className="text-xs text-[var(--fg-tertiary)] ml-3 font-mono">{al.slug}</span>
                  <span className="text-xs text-[var(--fg-tertiary)] ml-3">
                    {TYPE_OPTIONS.find((o) => o.value === al.type)?.label} · {al.year ?? '-'} · {t('adminmusic:trackCount', { count: al.tracks.length })}
                  </span>
                </div>
                <button
                  onClick={() => void onDeleteAlbum(al.slug)}
                  className="btn btn-ghost btn-sm hover:text-[#dc2626]"
                  aria-label="delete album"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {isOpen && (
                <div className="mt-5 pl-8 space-y-5">
                  {/* 封面 */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--bg-muted)] shrink-0 grid place-items-center text-[var(--fg-quaternary)]">
                      {al.coverUrl ? (
                        <img src={al.coverUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={18} />
                      )}
                    </div>
                    <div>
                      <input
                        ref={(el) => { coverRefs.current[al.slug] = el }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) void onUploadCover(al, f)
                        }}
                      />
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={coverUploading === al.slug}
                        onClick={() => coverRefs.current[al.slug]?.click()}
                      >
                        <ImageIcon size={13} />
                        {coverUploading === al.slug ? t('adminmusic:uploading') : t('adminmusic:uploadCover')}
                      </button>
                      <p className="text-[11px] text-[var(--fg-quaternary)] mt-1">{t('adminmusic:coverHint')}</p>
                    </div>
                  </div>

                  {/* 介绍编辑 */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-[var(--fg-tertiary)]">{t('adminmusic:fieldDesc')}</span>
                      {editingDesc !== al.slug ? (
                        <button
                          className="btn btn-ghost btn-sm !h-6 !px-1.5 !text-xs"
                          onClick={() => {
                            setEditingDesc(al.slug)
                            setDescDraft(al.description ?? '')
                          }}
                        >
                          <Pencil size={11} />
                        </button>
                      ) : (
                        <>
                          <button className="btn btn-ghost btn-sm !h-6 !px-1.5 !text-xs text-[var(--accent)]" onClick={() => void onSaveDesc(al.slug)}>
                            <Check size={11} />
                          </button>
                          <button className="btn btn-ghost btn-sm !h-6 !px-1.5 !text-xs" onClick={() => setEditingDesc(null)}>
                            <X size={11} />
                          </button>
                        </>
                      )}
                    </div>
                    {editingDesc === al.slug ? (
                      <textarea
                        className="input !h-24 py-2 w-full"
                        value={descDraft}
                        onChange={(e) => setDescDraft(e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-[var(--fg-secondary)] whitespace-pre-line">
                        {al.description || <span className="text-[var(--fg-quaternary)]">{t('adminmusic:noDesc')}</span>}
                      </p>
                    )}
                  </div>

                  {/* 曲目 */}
                  <div>
                    <div className="text-xs text-[var(--fg-tertiary)] mb-2">{t('adminmusic:tracks')}</div>
                    {al.tracks.length === 0 && (
                      <p className="text-sm text-[var(--fg-quaternary)]">{t('adminmusic:noTracks')}</p>
                    )}
                    <div className="space-y-1">
                      {al.tracks.map((tr, i) => (
                        <div key={tr.id} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[var(--bg-muted)] group">
                          <span className="text-xs text-[var(--fg-quaternary)] tabular-nums w-5">{i + 1}</span>
                          <span className="flex-1 min-w-0 text-sm text-[var(--fg-primary)] truncate">{tr.title}</span>
                          {tr.duration && (
                            <span className="text-xs text-[var(--fg-tertiary)] tabular-nums">
                              {Math.floor(tr.duration / 60)}:{String(Math.floor(tr.duration % 60)).padStart(2, '0')}
                            </span>
                          )}
                          {tr.audioUrl && (
                            <audio controls preload="none" src={tr.audioUrl} className="h-7 w-44 opacity-80" />
                          )}
                          <button
                            onClick={() => void onDeleteTrack(tr.id)}
                            className="btn btn-ghost btn-sm !h-7 !px-1.5 hover:text-[#dc2626] opacity-0 group-hover:opacity-100"
                            aria-label="delete track"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* 上传 */}
                    <div className="mt-3">
                      <input
                        ref={(el) => { fileRefs.current[al.slug] = el }}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) void onUploadTrack(al, f)
                        }}
                      />
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={uploading === al.slug}
                        onClick={() => fileRefs.current[al.slug]?.click()}
                      >
                        <Upload size={13} />
                        {uploading === al.slug ? t('adminmusic:uploading') : t('adminmusic:uploadTrack')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </section>
    </div>
  )
}
