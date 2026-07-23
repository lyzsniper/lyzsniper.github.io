import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * useAudioAnalyzer — 用 Web Audio API 的 AnalyserNode 实时提取频域数据。
 * 返回一个 getFrequencyData 函数和平均能量值（用于驱动视觉）。
 */
export function useAudioAnalyzer(audio: HTMLAudioElement | null) {
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const [energy, setEnergy] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!audio) return

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()
    ctxRef.current = ctx

    // MediaElementSource 只能创建一次 per element
    let source: MediaElementAudioSourceNode
    try {
      source = ctx.createMediaElementSource(audio)
    } catch {
      return // 已经创建过
    }
    sourceRef.current = source

    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8
    analyserRef.current = analyser

    source.connect(analyser)
    analyser.connect(ctx.destination)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      analyser.getByteFrequencyData(dataArray)
      // 计算平均能量（0–1）
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
      setEnergy(sum / dataArray.length / 255)
      rafRef.current = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(rafRef.current)
      try {
        source.disconnect()
        analyser.disconnect()
        ctx.close()
      } catch {
        // ignore
      }
    }
  }, [audio])

  const getFrequencyData = useCallback((): Uint8Array => {
    if (!analyserRef.current) return new Uint8Array(0)
    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(data)
    return data
  }, [])

  return { getFrequencyData, energy }
}
