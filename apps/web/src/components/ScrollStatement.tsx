import { useEffect, useRef } from 'react'

/**
 * ScrollStatement — 滚动逐字揭示的宣言文字。
 * 字符透明度 0.15 → 1 随滚动进度逐字点亮；prefers-reduced-motion 直接全亮。
 */
export default function ScrollStatement({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const spans = Array.from(el.querySelectorAll<HTMLSpanElement>('span[data-ch]'))
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      spans.forEach((s) => (s.style.opacity = '1'))
      return
    }

    let raf = 0
    const update = () => {
      const r = el.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.88 - r.top) / (window.innerHeight * 0.55)))
      spans.forEach((s, i) => {
        const cp = Math.min(1, Math.max(0, (p * spans.length - i) / 1.5))
        s.style.opacity = String(0.15 + cp * 0.85)
      })
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [text])

  return (
    <p
      ref={ref}
      className={`statement text-center font-semibold tracking-wide text-[var(--fg-primary)] ${className ?? ''}`}
      style={{ fontSize: 'clamp(18px, 2.2vw, 24px)' }}
      aria-label={text}
    >
      {Array.from(text).map((ch, i) => (
        <span key={i} data-ch aria-hidden="true">
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </p>
  )
}
