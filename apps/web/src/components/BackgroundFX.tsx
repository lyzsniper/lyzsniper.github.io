import { useEffect, useRef } from 'react'

/**
 * 背景特效：粒子网络 + 网格 + 扫描线 + 浮动代码
 * 完全复刻原 index.html 的视觉效果
 */
export default function BackgroundFX() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let particles: Particle[] = []
    let isMobile = window.innerWidth < 768
    const particleCount = isMobile ? 40 : 80
    const connectionDistance = 150
    const mouseRadius = 100
    const mouse = { x: null as number | null, y: null as number | null }
    let animationId = 0

    class Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string

      constructor() {
        this.x = Math.random() * canvas!.width
        this.y = Math.random() * canvas!.height
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = (Math.random() - 0.5) * 0.5
        this.size = Math.random() * 2 + 1
        this.color = ['#00f5ff', '#b829dd', '#ff2d95'][
          Math.floor(Math.random() * 3)
        ]
      }

      update() {
        this.x += this.vx
        this.y += this.vy

        if (this.x < 0 || this.x > canvas!.width) this.vx *= -1
        if (this.y < 0 || this.y > canvas!.height) this.vy *= -1

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x
          const dy = mouse.y - this.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mouseRadius) {
            const force = (mouseRadius - dist) / mouseRadius
            this.x -= dx * force * 0.02
            this.y -= dy * force * 0.02
          }
        }
      }

      draw() {
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()
      }
    }

    function resizeCanvas() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }

    function initParticles() {
      particles = []
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle())
      }
    }

    function connectParticles() {
      if (!ctx) return
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i]!.x - particles[j]!.x
          const dy = particles[i]!.y - particles[j]!.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < connectionDistance) {
            const opacity = 1 - dist / connectionDistance
            ctx.strokeStyle = `rgba(0, 245, 255, ${opacity * 0.3})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particles[i]!.x, particles[i]!.y)
            ctx.lineTo(particles[j]!.x, particles[j]!.y)
            ctx.stroke()
          }
        }
      }
    }

    function animate() {
      if (!ctx) return
      ctx.clearRect(0, 0, canvas!.width, canvas!.height)
      for (const p of particles) {
        p.update()
        p.draw()
      }
      connectParticles()
      animationId = requestAnimationFrame(animate)
    }

    function onResize() {
      resizeCanvas()
      const newIsMobile = window.innerWidth < 768
      if (newIsMobile !== isMobile) {
        isMobile = newIsMobile
        initParticles()
      }
    }

    function onMouseMove(e: MouseEvent) {
      mouse.x = e.x
      mouse.y = e.y
    }

    function onMouseOut() {
      mouse.x = null
      mouse.y = null
    }

    resizeCanvas()
    initParticles()
    animate()

    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseout', onMouseOut)

    // 浮动代码片段
    const codeSnippets = [
      'const agent = new Agent()',
      'await rag.retrieve()',
      'mcp.connect()',
      'agent.run()',
      'await llm.complete()',
      'a2a.send()',
      'class MyAgent',
      'def query()',
      'return result',
      'async def run()',
    ]
    function createFloatingCode() {
      const code = document.createElement('div')
      code.className = 'floating-code'
      code.textContent = codeSnippets[Math.floor(Math.random() * codeSnippets.length)]!
      code.style.left = Math.random() * 100 + 'vw'
      code.style.animationDuration = 15 + Math.random() * 10 + 's'
      document.body.appendChild(code)
      setTimeout(() => code.remove(), 25000)
    }
    const codeInterval = setInterval(createFloatingCode, 3000)

    // Reveal observer
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        }
      },
      { threshold: 0.15 },
    )
    // 等下一次 tick 让 React 完成渲染
    const revealTimer = setTimeout(() => {
      document.querySelectorAll('.reveal').forEach((el) => {
        revealObserver.observe(el)
      })
    }, 100)

    return () => {
      cancelAnimationFrame(animationId)
      clearInterval(codeInterval)
      clearTimeout(revealTimer)
      revealObserver.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseout', onMouseOut)
    }
  }, [])

  return (
    <>
      <canvas id="particles-canvas" ref={canvasRef} />
      <div className="grid-overlay" />
      <div className="scanline" />
    </>
  )
}
