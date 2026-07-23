import { useEffect, useRef } from 'react'
import { categoryVisual, coverPattern } from '@/lib/categoryColor'

/**
 * GenCover — 生成式封面（零图片素材）。
 * 三停渐变底 + 顶部高光 + 底部暗角，图案按分类稳定：
 * constellation（迷你星座）/ waves（流场）/ orbits（同心轨道）。
 * hover 缓慢放大由父级 CSS 控制（.gen-cover transition）。
 */

interface Props {
  category: string | null
  seed: string
  pattern?: 'constellation' | 'waves' | 'orbits'
  hue?: number
  /** flat=true 时纯色底 + 白色图案，不用渐变（平面化设计） */
  flat?: boolean
  className?: string
}

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default function GenCover({ category, seed, pattern, hue: hueProp, flat, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const parent = cv.parentElement
    if (!parent) return

    const draw = () => {
      const rect = parent.getBoundingClientRect()
      if (rect.width === 0) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cv.width = rect.width * dpr
      cv.height = rect.height * dpr
      const ctx = cv.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const W = rect.width
      const H = rect.height
      const { hue } = hueProp !== undefined ? { hue: hueProp } : categoryVisual(category, seed)
      const rand = mulberry32(hash(seed))

      if (flat) {
        // 平面模式：纯色底 + 白色高光弧线，零渐变
        ctx.fillStyle = `hsl(${hue} 48% 34%)`
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = 'rgba(255,255,255,0.06)'
        ctx.beginPath()
        ctx.arc(W * 0.85, H * 0.15, W * 0.45, 0, Math.PI * 2)
        ctx.fill()
      } else {
        const g = ctx.createLinearGradient(0, 0, W, H)
        g.addColorStop(0, `hsl(${hue} 62% 48%)`)
        g.addColorStop(0.55, `hsl(${(hue + 28) % 360} 60% 56%)`)
        g.addColorStop(1, `hsl(${(hue + 60) % 360} 58% 64%)`)
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)

        const hl = ctx.createRadialGradient(W * 0.25, H * 0.15, 0, W * 0.25, H * 0.15, W * 0.7)
        hl.addColorStop(0, 'rgba(255,255,255,0.28)')
        hl.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = hl
        ctx.fillRect(0, 0, W, H)
      }

      const p = pattern ?? coverPattern(category, seed)

      if (p === 'constellation') {
        const nodes: { x: number; y: number; r: number }[] = []
        const n = Math.floor(W / 16)
        for (let i = 0; i < n; i++) nodes.push({ x: rand() * W, y: rand() * H, r: 1 + rand() * 2 })
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y)
            if (d < W * 0.16) {
              ctx.strokeStyle = `rgba(255,255,255,${(1 - d / (W * 0.16)) * 0.4})`
              ctx.lineWidth = 0.7
              ctx.beginPath()
              ctx.moveTo(nodes[i].x, nodes[i].y)
              ctx.lineTo(nodes[j].x, nodes[j].y)
              ctx.stroke()
            }
          }
        }
        for (const nd of nodes) {
          ctx.fillStyle = `rgba(255,255,255,${0.5 + rand() * 0.5})`
          ctx.beginPath()
          ctx.arc(nd.x, nd.y, nd.r, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (p === 'waves') {
        const lines = 14
        for (let l = 0; l < lines; l++) {
          const yBase = (H / (lines - 1)) * l
          const amp = 4 + rand() * 10
          const freq = 1.5 + rand() * 2.5
          const phase = rand() * Math.PI * 2
          ctx.strokeStyle = `rgba(255,255,255,${0.08 + rand() * 0.25})`
          ctx.lineWidth = 0.8 + rand() * 0.8
          ctx.beginPath()
          for (let x = 0; x <= W; x += 4) {
            const y = yBase + Math.sin((x / W) * Math.PI * freq + phase) * amp
            if (x === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
        }
        for (let i = 0; i < 20; i++) {
          ctx.fillStyle = `rgba(255,255,255,${0.2 + rand() * 0.5})`
          ctx.beginPath()
          ctx.arc(rand() * W, rand() * H, 0.8 + rand() * 1.2, 0, Math.PI * 2)
          ctx.fill()
        }
      } else {
        const cx0 = W * (0.7 + rand() * 0.2)
        const cy0 = H * (0.65 + rand() * 0.25)
        const maxR = Math.hypot(W, H) * 0.7
        const rings = 12
        for (let i = 1; i <= rings; i++) {
          const r = (maxR / rings) * i
          const start = rand() * Math.PI * 2
          const span = Math.PI * (0.5 + rand() * 1.2)
          ctx.strokeStyle = `rgba(255,255,255,${0.08 + rand() * 0.22})`
          ctx.lineWidth = 0.8 + rand()
          ctx.beginPath()
          ctx.arc(cx0, cy0, r, start, start + span)
          ctx.stroke()
          const sa = start + span * rand()
          ctx.fillStyle = `rgba(255,255,255,${0.4 + rand() * 0.5})`
          ctx.beginPath()
          ctx.arc(cx0 + Math.cos(sa) * r, cy0 + Math.sin(sa) * r, 1.2 + rand() * 1.4, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      const vg = ctx.createLinearGradient(0, H * 0.55, 0, H)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(0,0,0,0.22)')
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, W, H)
    }

    draw()
    let rz: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(rz)
      rz = setTimeout(draw, 150)
    }
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(rz)
      window.removeEventListener('resize', onResize)
    }
  }, [category, seed, pattern, hueProp, flat])

  return (
    <canvas
      ref={ref}
      className={className}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  )
}
