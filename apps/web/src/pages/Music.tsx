import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause, Music2, ArrowLeft, Disc3 } from 'lucide-react'
import { api, type AlbumInfo } from '@/lib/api'
import GenCover from '@/components/GenCover'
import { useHead } from '@/lib/useHead'
import { usePlayerStore } from '@/store/player'

const TYPE_LABEL: Record<AlbumInfo['type'], string> = {
  album: '专辑',
  ep: 'EP',
  single: '单曲',
}

function fmt(sec: number | null): string {
  if (sec === null || Number.isNaN(sec)) return '--:--'
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`
}

/* -------------------------------------------------------------------------- */
/*  3D 视差专辑卡                                                               */
/* -------------------------------------------------------------------------- */
function AlbumCard({
  album,
  onOpen,
  onPlay,
  isPlaying,
}: {
  album: AlbumInfo
  onOpen: () => void
  onPlay: () => void
  isPlaying: boolean
}) {
  const cardRef = useRef<HTMLButtonElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [glow, setGlow] = useState({ x: 50, y: 50 })

  const handleMove = (e: React.MouseEvent) => {
    const el = cardRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    setTilt({ x: (py - 0.5) * -12, y: (px - 0.5) * 12 })
    setGlow({ x: px * 100, y: py * 100 })
  }

  const handleLeave = () => {
    setTilt({ x: 0, y: 0 })
    setGlow({ x: 50, y: 50 })
  }

  return (
    <button
      ref={cardRef}
      onClick={onOpen}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group relative text-left"
      style={{ perspective: '800px' }}
    >
      <div
        className="relative rounded-2xl overflow-hidden transition-transform duration-300 ease-out"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.x || tilt.y ? 1.03 : 1})`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* 专辑封面 */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden ring-1 ring-white/[0.06]">
          {album.coverUrl ? (
            <img
              src={album.coverUrl}
              alt={album.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <GenCover category={null} seed={album.slug} hue={album.hue} flat />
          )}

          {/* 悬浮光晕 */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, hsl(${album.hue} 80% 60% / 0.3), transparent 60%)`,
            }}
          />

          {/* 悬浮播放按钮 */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div
              onClick={(e) => {
                e.stopPropagation()
                onPlay()
              }}
              className="w-14 h-14 rounded-full grid place-items-center shadow-2xl backdrop-blur-md transition-transform duration-200 hover:scale-110 active:scale-95 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, hsl(${album.hue} 70% 55%), hsl(${(album.hue + 40) % 360} 70% 45%))`,
                boxShadow: `0 8px 32px hsl(${album.hue} 80% 40% / 0.5)`,
              }}
            >
              {isPlaying ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white ml-0.5" />}
            </div>
          </div>

          {/* 播放中脉冲环 */}
          {isPlaying && (
            <div className="absolute inset-0 rounded-2xl ring-2 ring-[var(--accent)] animate-pulse pointer-events-none" />
          )}
        </div>
      </div>

      {/* 信息 */}
      <div className="mt-3 px-1">
        <div className="font-semibold text-[var(--fg-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
          {album.title}
        </div>
        <div className="text-xs text-[var(--fg-tertiary)] mt-0.5">
          {album.year ?? ''} · {TYPE_LABEL[album.type]} · {album.tracks.length} 首
        </div>
      </div>
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*  EQ 均衡器                                                                   */
/* -------------------------------------------------------------------------- */
function EQ({ active, hue = 220 }: { active: boolean; hue?: number }) {
  return (
    <span className="inline-flex items-end gap-[2px] h-4 w-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`block w-[3px] rounded-full ${active ? 'animate-eq' : ''}`}
          style={{
            animationDelay: `${i * 0.12}s`,
            height: active ? undefined : '4px',
            background: active ? `hsl(${hue} 70% 60%)` : 'var(--fg-quaternary)',
          }}
        />
      ))}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  主页面                                                                      */
/* -------------------------------------------------------------------------- */
export default function Music() {
  const { t } = useTranslation(['music'])
  useHead({ title: '音乐 · AI前沿量子港', description: 'AI 生成音乐作品集 — AI前沿量子港' })

  const [albums, setAlbums] = useState<AlbumInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [openSlug, setOpenSlug] = useState<string | null>(null)

  const setAlbumsStore = usePlayerStore((s) => s.setAlbums)
  const playAlbum = usePlayerStore((s) => s.playAlbum)
  const playTrack = usePlayerStore((s) => s.playTrack)
  const current = usePlayerStore((s) => s.queue[s.index] ?? null)
  const playing = usePlayerStore((s) => s.playing)
  const toggle = usePlayerStore((s) => s.toggle)

  const openAlbum = useMemo(
    () => albums.find((a) => a.slug === openSlug) ?? null,
    [albums, openSlug],
  )

  useEffect(() => {
    api
      .listAlbums()
      .then((r) => {
        setAlbums(r.albums)
        setAlbumsStore(r.albums)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'load failed'))
  }, [setAlbumsStore])

  return (
    <div className="min-h-screen">
      {/* ============================================================ */}
      {/*  艺术家 Hero —— 沉浸式全宽                                      */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden">
        {/* 背景光晕 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%)',
          }}
        />

        <div className="container-page relative pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="flex flex-col items-center text-center">
            {/* 大头像 */}
            <div className="relative mb-8">
              <div
                className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden ring-2 ring-[var(--accent)]/30 shadow-2xl"
                style={{
                  boxShadow: `0 0 60px color-mix(in srgb, var(--accent) 25%, transparent)`,
                }}
              >
                <img
                  src="/量子港.png"
                  alt="AI前沿量子港"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* 旋转光环 */}
              <div
                className="absolute inset-[-8px] rounded-full border border-dashed border-[var(--accent)]/20"
                style={{ animation: 'spin 20s linear infinite' }}
              />
              <div
                className="absolute inset-[-16px] rounded-full border border-[var(--accent)]/10"
                style={{ animation: 'spin 30s linear infinite reverse' }}
              />
            </div>

            {/* 标签 */}
            <div className="flex items-center gap-2 mb-4">
              <Music2 size={14} className="text-[var(--accent)]" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--fg-tertiary)]">
                {t('music:eyebrow')}
              </span>
            </div>

            {/* 超大艺术家名 */}
            <h1
              className="font-bold tracking-tight text-[var(--fg-primary)]"
              style={{
                fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
              }}
            >
              AI前沿量子港
            </h1>

            {/* 元数据 */}
            <p className="text-sm text-[var(--fg-secondary)] mt-4">
              {t('music:subtitle', {
                albums: albums.length,
                tracks: albums.reduce((s, a) => s + a.tracks.length, 0),
              })}
            </p>

            {/* 播放全部 */}
            <button
              onClick={() => {
                if (albums.length > 0) {
                  if (playing) toggle()
                  else playAlbum(albums[0].slug)
                }
              }}
              className="mt-8 group relative inline-flex items-center gap-3 h-12 px-8 rounded-full font-medium text-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-fg)',
                boxShadow: `0 8px 32px color-mix(in srgb, var(--accent) 40%, transparent)`,
              }}
            >
              {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              {playing ? t('music:pause') : t('music:playAll')}
            </button>
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-[#dc2626] text-center mt-4">{error}</p>}

      {/* ============================================================ */}
      {/*  专辑网格 / 详情                                              */}
      {/* ============================================================ */}
      <div className="container-page pb-32">
        {!openAlbum && (
          <section className="mt-8">
            <div className="flex items-baseline gap-3 mb-8">
              <h2
                className="font-bold text-[var(--fg-primary)]"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', letterSpacing: '-0.02em' }}
              >
                {t('music:works')}
              </h2>
              <span className="text-xs text-[var(--fg-tertiary)] font-medium uppercase tracking-wider">
                {albums.length} releases
              </span>
            </div>

            {albums.length === 0 && !error && (
              <div className="surface-card p-20 text-center">
                <Disc3 size={40} className="mx-auto text-[var(--fg-quaternary)] mb-4" />
                <p className="text-sm text-[var(--fg-secondary)]">{t('music:empty')}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {albums.map((al) => (
                <AlbumCard
                  key={al.slug}
                  album={al}
                  onOpen={() => setOpenSlug(al.slug)}
                  onPlay={() => playAlbum(al.slug)}
                  isPlaying={playing && current?.id === al.tracks.find((tr) => tr.id === current?.id)?.id}
                />
              ))}
            </div>
          </section>
        )}

        {/* 专辑详情 */}
        {openAlbum && (
          <section className="mt-4">
            <button
              onClick={() => setOpenSlug(null)}
              className="group inline-flex items-center gap-2 text-sm text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors mb-8"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              {t('music:back')}
            </button>

            {/* 专辑头 */}
            <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
              <div className="relative w-52 h-52 md:w-64 md:h-64 rounded-2xl overflow-hidden shrink-0 ring-1 ring-white/[0.06] shadow-2xl">
                {openAlbum.coverUrl ? (
                  <img src={openAlbum.coverUrl} alt={openAlbum.title} className="w-full h-full object-cover" />
                ) : (
                  <GenCover category={null} seed={openAlbum.slug} hue={openAlbum.hue} flat />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--fg-tertiary)] mb-2">
                  {TYPE_LABEL[openAlbum.type]}
                </div>
                <h2
                  className="font-bold text-[var(--fg-primary)]"
                  style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
                >
                  {openAlbum.title}
                </h2>
                <p className="text-sm text-[var(--fg-tertiary)] mt-3">
                  AI前沿量子港 · {openAlbum.year ?? ''} · {openAlbum.tracks.length} 首
                </p>
                {openAlbum.description && (
                  <p className="text-sm text-[var(--fg-secondary)] mt-4 max-w-xl leading-relaxed whitespace-pre-line">
                    {openAlbum.description}
                  </p>
                )}
                <button
                  onClick={() => playAlbum(openAlbum.slug)}
                  className="mt-6 inline-flex items-center gap-2 h-10 px-6 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--accent-fg)',
                    boxShadow: `0 4px 20px color-mix(in srgb, var(--accent) 35%, transparent)`,
                  }}
                >
                  <Play size={14} className="ml-0.5" /> {t('music:play')}
                </button>
              </div>
            </div>

            {/* 曲目表 */}
            <div className="space-y-1">
              {openAlbum.tracks.map((tr) => {
                const active = current?.id === tr.id
                return (
                  <button
                    key={tr.id}
                    onClick={() => tr.audioUrl && playTrack(tr.id)}
                    className={`w-full grid grid-cols-[48px_1fr_auto] items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all duration-200 ${
                      active
                        ? 'bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/20'
                        : 'hover:bg-[var(--bg-muted)]'
                    }`}
                  >
                    <span className="flex items-center justify-center w-8">
                      {active ? <EQ active={playing} hue={openAlbum.hue} /> : (
                        <span className="text-sm text-[var(--fg-quaternary)] tabular-nums font-medium">
                          {String(openAlbum.tracks.indexOf(tr) + 1).padStart(2, '0')}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block truncate font-medium ${active ? 'text-[var(--accent)]' : 'text-[var(--fg-primary)]'}`}
                      >
                        {tr.title}
                      </span>
                      {tr.subtitle && (
                        <span className="block truncate text-xs text-[var(--fg-tertiary)] mt-0.5">
                          {tr.subtitle}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-[var(--fg-tertiary)] tabular-nums font-medium">
                      {fmt(tr.duration)}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
