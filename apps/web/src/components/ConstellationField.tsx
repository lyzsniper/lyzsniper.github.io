import { useEffect, useRef } from 'react'

/**
 * ConstellationField — 全局星座场（整站唯一背景特效层，fixed z-0）。
 *
 * - 三角粒子 + 邻近连线铺满整个视口：60% 聚在右侧 4 个团簇（hero 视觉重心），40% 全场散布
 * - 鼠标聚光灯：260px 内粒子提亮/放大/吸附，连线同步增亮（lerp 0.1 平滑跟随）
 * - 聚光灯同时「揭示」一层隐藏细网格（平时不可见）
 * - 滚动视差：背景以 6% 速率随滚动漂移
 * - 明暗双模式：暗色全彩、亮色高可见 alpha；prefers-reduced-motion 画静帧
 * - 帧率自适应降级：FPS 持续偏低时隔行连线 → 粒子减半
 * 纯 Canvas 生成，零素材。
 */

interface Star {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rot: number
  vr: number
  color: string
  alpha: number
  phase: number
  tw: number
}

interface MeshDot {
  x: number
  y: number
  c: string
}

const SPOTLIGHT_R = 260
const PARALLAX = 0.06

const PALETTE = [
  { c: '129,140,248', w: 0.34 },
  { c: '128,82,255', w: 0.24 },
  { c: '45,212,191', w: 0.15 },
  { c: '244,114,182', w: 0.11 },
  { c: '191,219,254', w: 0.08 },
  { c: '255,184,41', w: 0.08 },
]

function pickColor(): string {
  const r = Math.random()
  let acc = 0
  for (const p of PALETTE) {
    acc += p.w
    if (r <= acc) return p.c
  }
  return PALETTE[0].c
}

function gauss(): number {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5
}

function makeStar(x: number, y: number, inCloud: boolean): Star {
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 0.1,
    vy: (Math.random() - 0.5) * 0.1,
    size: (inCloud ? 1.6 : 1.0) + Math.random() * 2.4,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.01,
    color: pickColor(),
    alpha: (inCloud ? 0.4 : 0.25) + Math.random() * 0.4,
    phase: Math.random() * Math.PI * 2,
    tw: 0.4 + Math.random() * 0.8,
  }
}

export default function ConstellationField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mouse = { x: window.innerWidth * 0.62, y: window.innerHeight * 0.42 }
    const smooth = { x: mouse.x, y: mouse.y }

    let stars: Star[] = []
    let mesh: MeshDot[] = []
    let dpr = 1
    let scrollY = 0
    let rafId = 0

    // 帧率自适应降级（0=全量 1=隔行连线 2=半量粒子）
    let perfLevel = 0
    let dtEma = 16.7
    let frameCount = 0
    let lastTs = 0

    function build(starScale = 1) {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (!canvas) return
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      const W = window.innerWidth
      const H = window.innerHeight

      stars = []
      const total = Math.floor((W < 768 ? 110 : 240) * starScale)
      const clusters = [
        { x: W * 0.68, y: H * 0.28, r: W * 0.1 },
        { x: W * 0.84, y: H * 0.46, r: W * 0.12 },
        { x: W * 0.62, y: H * 0.6, r: W * 0.09 },
        { x: W * 0.8, y: H * 0.14, r: W * 0.07 },
      ]
      const nCluster = Math.floor(total * 0.6)
      const perCluster = Math.floor(nCluster / clusters.length)
      for (const cl of clusters) {
        for (let i = 0; i < perCluster; i++) {
          stars.push(makeStar(cl.x + gauss() * cl.r, cl.y + gauss() * cl.r * 0.9, true))
        }
      }
      for (let i = stars.length; i < total; i++) {
        stars.push(makeStar(Math.random() * W, Math.random() * H, false))
      }

      mesh = []
      const gap = 46
      for (let x = gap / 2; x < W; x += gap) {
        for (let y = gap / 2; y < H; y += gap) {
          mesh.push({ x: x + gauss() * 6, y: y + gauss() * 6, c: pickColor() })
        }
      }
    }

    function drawTri(x: number, y: number, size: number, rot: number, color: string, alpha: number) {
      if (!ctx) return
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rot)
      ctx.beginPath()
      ctx.moveTo(0, -size)
      ctx.lineTo(size * 0.866, size * 0.5)
      ctx.lineTo(-size * 0.866, size * 0.5)
      ctx.closePath()
      ctx.fillStyle = `rgba(${color},${alpha * 0.35})`
      ctx.fill()
      ctx.strokeStyle = `rgba(${color},${alpha})`
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.restore()
    }

    function draw(t: number) {
      if (!ctx || !canvas) return
      const W = canvas.width / dpr
      const H = canvas.height / dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const dark = document.documentElement.classList.contains('dark')
      const starK = dark ? 1 : 0.9
      const linkBase = dark ? 0.14 : 0.11
      const linkMax = dark ? 0.55 : 0.42
      const offY = (scrollY * PARALLAX) % H

      // 聚光灯揭示隐藏细网格（压在星网下面）
      const meshA = dark ? 0.32 : 0.24
      for (let i = 0; i < mesh.length; i++) {
        const m = mesh[i]
        const my = ((m.y - offY) % H + H) % H
        const md = Math.hypot(m.x - smooth.x, my - smooth.y)
        if (md < SPOTLIGHT_R * 0.92) {
          const f = 1 - md / (SPOTLIGHT_R * 0.92)
          const a = f * f * meshA
          const right = mesh[i + 1]
          if (right && right.x - m.x < 60) {
            const ry = ((right.y - offY) % H + H) % H
            const rd = Math.hypot(right.x - smooth.x, ry - smooth.y)
            if (rd < SPOTLIGHT_R * 0.92) {
              ctx.strokeStyle = `rgba(${m.c},${a * 0.6})`
              ctx.lineWidth = 0.5
              ctx.beginPath()
              ctx.moveTo(m.x, my)
              ctx.lineTo(right.x, ry)
              ctx.stroke()
            }
          }
          ctx.fillStyle = `rgba(${m.c},${a})`
          ctx.beginPath()
          ctx.arc(m.x, my, 1.1, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      const linkDist = Math.min(W * 0.075, 96)
      const iStep = perfLevel >= 1 ? 2 : 1
      for (let i = 0; i < stars.length; i += iStep) {
        const s = stars[i]
        const sy1 = ((s.y - offY) % H + H) % H
        for (let j = i + 1; j < stars.length; j++) {
          const o = stars[j]
          const sy2 = ((o.y - offY) % H + H) % H
          const dx = s.x - o.x
          const dy = sy1 - sy2
          const d2 = dx * dx + dy * dy
          if (d2 < linkDist * linkDist) {
            const d = Math.sqrt(d2)
            let la = (1 - d / linkDist) * linkBase
            const mx = (s.x + o.x) / 2 - smooth.x
            const my = (sy1 + sy2) / 2 - smooth.y
            const md = Math.hypot(mx, my)
            if (md < SPOTLIGHT_R) la *= 1 + (1 - md / SPOTLIGHT_R) * 2.2
            ctx.strokeStyle = `rgba(${s.color},${Math.min(la, linkMax)})`
            ctx.lineWidth = 0.6
            ctx.beginPath()
            ctx.moveTo(s.x, sy1)
            ctx.lineTo(o.x, sy2)
            ctx.stroke()
          }
        }
      }

      for (const s of stars) {
        s.x += s.vx
        s.y += s.vy
        s.rot += s.vr
        if (s.x < -20) s.x = W + 20
        if (s.x > W + 20) s.x = -20
        if (s.y < -20) s.y = H + 20
        if (s.y > H + 20) s.y = -20

        const sy = ((s.y - offY) % H + H) % H
        const tw = 0.65 + 0.35 * Math.sin(t * s.tw + s.phase)
        let alpha = s.alpha * tw * starK
        let size = s.size

        const md = Math.hypot(s.x - smooth.x, sy - smooth.y)
        if (md < SPOTLIGHT_R) {
          const f = 1 - md / SPOTLIGHT_R
          alpha = Math.min(1, alpha + f * f * (dark ? 0.75 : 0.6))
          size += f * 1.8
          s.x += (smooth.x - s.x) * 0.012 * f
          s.y += (smooth.y + offY - s.y) * 0.012 * f
        }
        drawTri(s.x, sy, size, s.rot, s.color, alpha)
      }
    }

    function tick(ts: number) {
      if (lastTs) {
        const dt = ts - lastTs
        if (dt < 250) dtEma = dtEma * 0.95 + dt * 0.05
      }
      lastTs = ts
      if (++frameCount % 180 === 0) {
        const fps = 1000 / dtEma
        if (fps < 32 && perfLevel < 2) {
          perfLevel = 2
          build(0.55)
        } else if (fps < 42 && perfLevel < 1) {
          perfLevel = 1
        }
      }

      smooth.x += (mouse.x - smooth.x) * 0.1
      smooth.y += (mouse.y - smooth.y) * 0.1
      draw(performance.now() / 1000)
      rafId = requestAnimationFrame(tick)
    }

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    const onResize = () => build(perfLevel >= 2 ? 0.55 : 1)
    const onScroll = () => {
      scrollY = window.scrollY
    }

    build()

    if (reduced) {
      draw(0)
    } else {
      rafId = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
