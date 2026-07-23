import { useCallback, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  ChevronUp,
  ListMusic,
  Disc3,
} from 'lucide-react'
import type { AlbumInfo } from '@/lib/api'
import { usePlayerStore, getAudioElement } from '@/store/player'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import GenCover from '@/components/GenCover'
import FrequencyVisualizer from '@/components/FrequencyVisualizer'

function fmt(sec: number | null): string {
  if (sec === null || Number.isNaN(sec) || !isFinite(sec)) return '--:--'
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`
}

/* -------------------------------------------------------------------------- */
/*  可拖拽滑条                                                                  */
/* -------------------------------------------------------------------------- */
function Slider({
  value,
  onChange,
  className = '',
  alwaysShowThumb = false,
  hue = 220,
}: {
  value: number
  onChange: (v: number) => void
  className?: string
  alwaysShowThumb?: boolean
  hue?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const calc = useCallback(
    (clientX: number) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      onChange(Math.min(1, Math.max(0, (clientX - r.left) / r.width)))
    },
    [onChange],
  )

  return (
    <div
      ref={ref}
      className={`player-slider relative group cursor-pointer touch-none ${
        dragging ? 'dragging' : ''
      } ${className}`}
      onPointerDown={(e) => {
        setDragging(true)
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        calc(e.clientX)
      }}
      onPointerMove={(e) => {
        if (dragging) calc(e.clientX)
      }}
      onPointerUp={(e) => {
        setDragging(false)
        ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
      }}
    >
      <div className="h-[3px] rounded-full bg-white/10">
        <div
          className="player-fill h-full rounded-full"
          style={{
            width: `${value * 100}%`,
            background: `linear-gradient(90deg, hsl(${hue} 70% 55%), hsl(${(hue + 30) % 360} 80% 65%))`,
          }}
        />
      </div>
      <div
        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full shadow-lg transition-opacity pointer-events-none ${
          alwaysShowThumb || dragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        style={{
          left: `${value * 100}%`,
          background: `hsl(${hue} 70% 70%)`,
          boxShadow: `0 0 8px hsl(${hue} 80% 60% / 0.6)`,
        }}
      />
    </div>
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
/*  底部播放器                                                                  */
/* ----------------------------------------------------------------========== */
export default function Player() {
  const { t } = useTranslation(['music'])
  const location = useLocation()
  const isMusicPage = location.pathname.startsWith('/music')

  const queue = usePlayerStore((s) => s.queue)
  const index = usePlayerStore((s) => s.index)
  const playing = usePlayerStore((s) => s.playing)
  const curTime = usePlayerStore((s) => s.curTime)
  const duration = usePlayerStore((s) => s.duration)
  const volume = usePlayerStore((s) => s.volume)
  const expanded = usePlayerStore((s) => s.expanded)
  const albums = usePlayerStore((s) => s.albums)

  const toggle = usePlayerStore((s) => s.toggle)
  const next = usePlayerStore((s) => s.next)
  const prev = usePlayerStore((s) => s.prev)
  const seek = usePlayerStore((s) => s.seek)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const setExpanded = usePlayerStore((s) => s.setExpanded)
  const playQueue = usePlayerStore((s) => s.playQueue)

  const current = queue[index] ?? null
  const currentAlbum: AlbumInfo | null = current
    ? albums.find((a) => a.tracks.some((tr) => tr.id === current.id)) ?? null
    : null

  const hue = currentAlbum?.hue ?? 220

  // 音频分析器（频谱可视化）
  const audioEl = getAudioElement()
  const { getFrequencyData } = useAudioAnalyzer(expanded ? audioEl : null)

  // 可见性
  const visible = isMusicPage || playing
  if (!visible) return null

  const progress = duration > 0 ? curTime / duration : 0
  const rest = queue.slice(index + 1)

  return (
    <>
      {/* ============================================================ */}
      {/*  迷你播放条                                                    */}
      {/* ============================================================ */}
      <div
        className="fixed left-0 right-0 bottom-0 z-40"
        style={{
          background: `linear-gradient(180deg, hsl(240 12% 8% / 0.88) 0%, hsl(240 15% 5% / 0.96) 100%)`,
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* 顶部进度条 */}
        <Slider
          value={progress}
          onChange={(v) => seek(v * duration)}
          alwaysShowThumb
          hue={hue}
          className="!h-1"
        />

        <div className="container-page h-[72px] grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* 左：封面 + 曲名 */}
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-3 min-w-0 text-left group/title"
            aria-label={t('music:expand')}
          >
            <div
              className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/10"
              style={{
                animation: playing ? 'spin 8s linear infinite' : 'none',
              }}
            >
              {currentAlbum?.coverUrl ? (
                <img src={currentAlbum.coverUrl} alt="" className="w-full h-full object-cover" />
              ) : current ? (
                <GenCover category={null} seed={currentAlbum?.slug ?? 'music'} hue={hue} flat />
              ) : (
                <div className="w-full h-full bg-white/5 grid place-items-center">
                  <Disc3 size={20} className="text-white/30" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate group-hover/title:text-white/80 transition-colors">
                {current?.title ?? t('music:nothing')}
              </div>
              <div className="text-xs text-white/35 truncate">
                {currentAlbum?.title ?? 'AI前沿量子港'}
              </div>
            </div>
          </button>

          {/* 中：控制按钮 + 进度条 */}
          <div className="flex flex-col items-center gap-1 w-full max-w-lg">
            <div className="flex items-center gap-6">
              <button
                onClick={prev}
                className="w-10 h-10 grid place-items-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
                aria-label="previous"
              >
                <SkipBack size={18} />
              </button>
              <button
                onClick={toggle}
                className="w-11 h-11 rounded-full grid place-items-center hover:scale-105 active:scale-95 transition shadow-lg"
                style={{
                  background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 45%))`,
                  boxShadow: `0 4px 20px hsl(${hue} 80% 40% / 0.5)`,
                }}
                aria-label="play/pause"
              >
                {playing ? <Pause size={18} className="text-white" /> : <Play size={18} className="text-white ml-0.5" />}
              </button>
              <button
                onClick={next}
                className="w-10 h-10 grid place-items-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
                aria-label="next"
              >
                <SkipForward size={18} />
              </button>
            </div>
            <div className="hidden md:flex items-center gap-2 w-full">
              <span className="text-[10px] text-white/35 tabular-nums w-9">{fmt(curTime)}</span>
              <Slider
                value={progress}
                onChange={(v) => seek(v * duration)}
                className="flex-1"
                alwaysShowThumb
                hue={hue}
              />
              <span className="text-[10px] text-white/35 tabular-nums w-9 text-right">
                {fmt(current?.duration ?? null)}
              </span>
            </div>
          </div>

          {/* 右：音量 + 展开 */}
          <div className="hidden md:flex items-center gap-2 justify-end">
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
              className="w-9 h-9 grid place-items-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition"
              aria-label={volume > 0 ? t('music:mute') : t('music:unmute')}
            >
              {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <Slider value={volume} onChange={setVolume} className="w-24" hue={hue} />
            <button
              onClick={() => setExpanded(true)}
              className="w-9 h-9 grid place-items-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition"
              aria-label={t('music:expand')}
            >
              <ChevronUp size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  展开全屏播放器                                                 */}
      {/* ============================================================ */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex flex-col player-expanded-enter">
          {/* 背景：专辑色调晕染 */}
          <div
            className="absolute inset-0 transition-all duration-700"
            style={{
              background: currentAlbum?.hue
                ? `linear-gradient(160deg, hsl(${currentAlbum.hue} 45% 12%) 0%, hsl(${currentAlbum.hue} 35% 5%) 40%, #050508 100%)`
                : 'linear-gradient(160deg, #16162a 0%, #050508 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
            }}
          />

          {/* 顶部工具栏 */}
          <div className="relative flex items-center justify-between px-6 py-4 shrink-0">
            <button
              onClick={() => setExpanded(false)}
              className="w-10 h-10 grid place-items-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
              aria-label={t('music:collapse')}
            >
              <ChevronUp size={22} className="rotate-180" />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-white/35">
              <ListMusic size={14} />
              {t('music:queue')}
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="w-10 h-10 grid place-items-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
              aria-label={t('music:collapse')}
            >
              <X size={20} />
            </button>
          </div>

          {/* 主体 */}
          <div className="relative flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-6 pb-12 flex flex-col items-center gap-8">
              {/* 大封面 */}
              <div
                className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl transition-transform duration-700"
                style={{
                  transform: playing ? 'scale(1)' : 'scale(0.88)',
                  boxShadow: `0 20px 60px hsl(${hue} 60% 20% / 0.5)`,
                }}
              >
                {currentAlbum?.coverUrl ? (
                  <img src={currentAlbum.coverUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <GenCover category={null} seed={currentAlbum?.slug ?? 'music'} hue={hue} flat />
                )}
              </div>

              {/* 实时频谱可视化 */}
              <div className="w-full flex justify-center">
                <FrequencyVisualizer
                  getFrequencyData={getFrequencyData}
                  width={Math.min(420, typeof window !== 'undefined' ? window.innerWidth - 48 : 420)}
                  height={48}
                  bars={64}
                  color={`hsl(${hue} 70% 60%)`}
                />
              </div>

              {/* 曲名 / 专辑 + EQ */}
              <div className="text-center w-full flex items-center justify-center gap-4">
                <div className="min-w-0 flex-1 text-right">
                  <h2 className="text-xl md:text-2xl font-bold text-white truncate">
                    {current?.title ?? t('music:nothing')}
                  </h2>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <EQ active={!!playing} hue={hue} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm text-white/45 truncate">
                    {currentAlbum?.title ?? 'AI前沿量子港'}
                    {currentAlbum?.year ? ` · ${currentAlbum.year}` : ''}
                  </p>
                </div>
              </div>

              {/* 进度条 */}
              <div className="flex items-center gap-3 w-full">
                <span className="text-xs text-white/35 tabular-nums w-10">{fmt(curTime)}</span>
                <Slider
                  value={progress}
                  onChange={(v) => seek(v * duration)}
                  className="flex-1"
                  alwaysShowThumb
                  hue={hue}
                />
                <span className="text-xs text-white/35 tabular-nums w-10 text-right">
                  {fmt(current?.duration ?? null)}
                </span>
              </div>

              {/* 控制按钮 */}
              <div className="flex items-center gap-8">
                <button
                  onClick={prev}
                  className="w-14 h-14 grid place-items-center rounded-full text-white/55 hover:text-white hover:bg-white/10 transition"
                  aria-label="previous"
                >
                  <SkipBack size={26} />
                </button>
                <button
                  onClick={toggle}
                  className="w-16 h-16 rounded-full grid place-items-center hover:scale-105 active:scale-95 transition shadow-xl"
                  style={{
                    background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 45%))`,
                    boxShadow: `0 8px 32px hsl(${hue} 80% 40% / 0.5)`,
                  }}
                  aria-label="play/pause"
                >
                  {playing ? <Pause size={28} className="text-white" /> : <Play size={28} className="text-white ml-1" />}
                </button>
                <button
                  onClick={next}
                  className="w-14 h-14 grid place-items-center rounded-full text-white/55 hover:text-white hover:bg-white/10 transition"
                  aria-label="next"
                >
                  <SkipForward size={26} />
                </button>
              </div>

              {/* 音量 */}
              <div className="flex items-center gap-3 w-full max-w-xs">
                <button
                  onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                  className="w-10 h-10 grid place-items-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition"
                  aria-label={volume > 0 ? t('music:mute') : t('music:unmute')}
                >
                  {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <Slider value={volume} onChange={setVolume} className="flex-1" alwaysShowThumb hue={hue} />
              </div>

              {/* 播放队列 */}
              {rest.length > 0 && (
                <div className="w-full">
                  <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-white/25 mb-3 flex items-center gap-2">
                    <ListMusic size={13} />
                    {t('music:upNext')}
                  </h3>
                  <div className="space-y-1">
                    {rest.map((tr, i) => (
                      <button
                        key={tr.id}
                        onClick={() => playQueue(queue, index + 1 + i)}
                        className="w-full grid grid-cols-[32px_1fr_auto] items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/5 transition"
                      >
                        <span className="text-center text-xs text-white/25 tabular-nums">{i + 1}</span>
                        <span className="text-sm text-white/70 truncate">{tr.title}</span>
                        <span className="text-xs text-white/25 tabular-nums">{fmt(tr.duration)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
