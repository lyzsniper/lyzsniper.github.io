import { create } from 'zustand'
import type { AlbumInfo, TrackInfo } from '@/lib/api'

const playable = (tracks: TrackInfo[]) => tracks.filter((t) => t.audioUrl)

/* -------------------------------------------------------------------------- */
/*  全局音频元素（单例，跨页面持久化）                                              */
/* -------------------------------------------------------------------------- */
let audioEl: HTMLAudioElement | null = null
function getAudio() {
  if (!audioEl && typeof window !== 'undefined') {
    audioEl = new Audio()
    audioEl.volume = 0.8
    audioEl.crossOrigin = 'anonymous'
  }
  return audioEl
}

/** 获取全局音频元素（供 AnalyserNode 连接） */
export function getAudioElement() {
  return getAudio()
}

/** 在应用启动时调用一次，把音频事件桥接到 store */
let listenersSetup = false
export function setupPlayerListeners() {
  if (listenersSetup) return
  listenersSetup = true
  const el = getAudio()
  if (!el) return

  el.addEventListener('timeupdate', () => {
    usePlayerStore.getState().setCurTime(el!.currentTime)
  })
  el.addEventListener('loadedmetadata', () => {
    usePlayerStore.getState().setDuration(el!.duration)
  })
  el.addEventListener('ended', () => {
    usePlayerStore.getState().next()
  })
  el.addEventListener('pause', () => {
    usePlayerStore.getState().setPlaying(false)
  })
  el.addEventListener('play', () => {
    usePlayerStore.getState().setPlaying(true)
  })
}

/* -------------------------------------------------------------------------- */
/*  Store                                                                     */
/* -------------------------------------------------------------------------- */
interface PlayerState {
  albums: AlbumInfo[]
  queue: TrackInfo[]
  index: number
  playing: boolean
  curTime: number
  duration: number
  volume: number
  expanded: boolean

  setAlbums: (a: AlbumInfo[]) => void
  setPlaying: (b: boolean) => void
  setCurTime: (t: number) => void
  setDuration: (d: number) => void
  setVolume: (v: number) => void
  setExpanded: (b: boolean) => void

  playAlbum: (slug: string) => void
  playTrack: (trackId: number) => void
  playQueue: (tracks: TrackInfo[], startIdx: number) => void
  toggle: () => void
  next: () => void
  prev: () => void
  seek: (t: number) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  albums: [],
  queue: [],
  index: -1,
  playing: false,
  curTime: 0,
  duration: 0,
  volume: 0.8,
  expanded: false,

  setAlbums: (a) => set({ albums: a }),
  setPlaying: (b) => set({ playing: b }),
  setCurTime: (t) => set({ curTime: t }),
  setDuration: (d) => set({ duration: d }),
  setVolume: (v) => {
    set({ volume: v })
    const el = getAudio()
    if (el) el.volume = v
  },
  setExpanded: (b) => set({ expanded: b }),

  playQueue: (tracks, startIdx) => {
    const list = playable(tracks)
    if (!list.length) return
    const idx = Math.min(startIdx, list.length - 1)
    const el = getAudio()
    if (!el) return
    set({ queue: list, index: idx, curTime: 0 })
    el.src = list[idx].audioUrl!
    el.play().catch(() => {})
  },

  playAlbum: (slug) => {
    const album = get().albums.find((a) => a.slug === slug)
    if (album) get().playQueue(album.tracks, 0)
  },

  playTrack: (trackId) => {
    for (const album of get().albums) {
      if (!album.tracks.some((t) => t.id === trackId)) continue
      const list = playable(album.tracks)
      const idx = list.findIndex((t) => t.id === trackId)
      if (idx >= 0) get().playQueue(album.tracks, idx)
      return
    }
  },

  toggle: () => {
    const el = getAudio()
    if (!el) return
    const { playing, queue, index, albums } = get()
    // 无队列时自动播放第一张专辑
    if (!queue[index] && albums.length > 0) {
      const first = playable(albums[0].tracks)
      if (first.length > 0) get().playQueue(first, 0)
      return
    }
    if (playing) el.pause()
    else el.play().catch(() => {})
  },

  next: () => {
    const { queue } = get()
    if (!queue.length) return
    get().playQueue(queue, (get().index + 1) % queue.length)
  },

  prev: () => {
    const { queue, curTime } = get()
    if (!queue.length) return
    // 播放超过 3 秒则重播当前曲，否则上一首
    if (curTime > 3) {
      get().seek(0)
      return
    }
    get().playQueue(queue, (get().index - 1 + queue.length) % queue.length)
  },

  seek: (t) => {
    const el = getAudio()
    if (!el) return
    el.currentTime = t
    set({ curTime: t })
  },
}))
