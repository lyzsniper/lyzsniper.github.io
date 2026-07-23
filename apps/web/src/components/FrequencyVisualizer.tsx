import { useEffect, useRef } from 'react'

/**
 * 给 HSL 颜色字符串添加 alpha 通道。
 * 支持 hsl(h s% l%) / hsla(h, s%, l%, a) 两种输入，输出 hsl(h s% l% / a)。
 */
function withAlpha(color: string, alpha: number): string {
  // 去掉尾部空格，统一处理
  const c = color.trim()
  // 匹配 hsl(h s% l%)
  const hslMatch = c.match(/^hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)$/i)
  if (hslMatch) {
    return `hsl(${hslMatch[1]} ${hslMatch[2]}% ${hslMatch[3]}% / ${alpha})`
  }
  // 匹配 hsla(h, s%, l%, a)
  const hslaMatch = c.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*,?\s*([\d.]*)\s*\)$/i)
  if (hslaMatch) {
    return `hsla(${hslaMatch[1]}, ${hslaMatch[2]}%, ${hslaMatch[3]}%, ${alpha})`
  }
  // 回退：hex 颜色加两位 alpha
  if (/^#[0-9a-f]{6}$/i.test(c)) {
    const a = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0')
    return c + a
  }
  return color
}

interface Props {
  getFrequencyData: () => Uint8Array
  width?: number
  height?: number
  /** 条数 */
  bars?: number
  /** 颜色 */
  color?: string
  /** 圆角条 */
  rounded?: boolean
  className?: string
}

/**
 * FrequencyVisualizer — Canvas 实时频谱可视化。
 * 用 AnalyserNode 的频域数据绘制柱状频谱，支持渐变色和发光。
 */
export default function FrequencyVisualizer({
  getFrequencyData,
  width = 300,
  height = 60,
  bars = 48,
  color = '#818cf8',
  rounded = true,
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const draw = () => {
      const data = getFrequencyData()
      ctx.clearRect(0, 0, width, height)

      if (data.length === 0) {
        // 无数据时绘制静止的基线
        const barW = width / bars
        for (let i = 0; i < bars; i++) {
          const x = i * barW
          ctx.fillStyle = color
          ctx.globalAlpha = 0.25
          const h = 2
          const y = height - h
          if (rounded) {
            ctx.beginPath()
            ctx.roundRect(x + 1, y, barW - 2, h, 1)
            ctx.fill()
          } else {
            ctx.fillRect(x + 1, y, barW - 2, h)
          }
        }
        ctx.globalAlpha = 1
        rafRef.current = requestAnimationFrame(draw)
        return
      }

      const step = Math.floor(data.length / bars)
      const barW = width / bars

      for (let i = 0; i < bars; i++) {
        // 取频段平均值
        let sum = 0
        for (let j = 0; j < step; j++) {
          sum += data[i * step + j] || 0
        }
        const avg = sum / step / 255
        const barH = Math.max(2, avg * height * 0.9)
        const x = i * barW
        const y = height - barH

        // 渐变色：底部亮，顶部暗（用 /alpha 语法给 HSL 加透明度）
        const grad = ctx.createLinearGradient(x, height, x, y)
        grad.addColorStop(0, color)
        grad.addColorStop(1, withAlpha(color, 0.25))
        ctx.fillStyle = grad
        ctx.globalAlpha = 0.85

        if (rounded) {
          ctx.beginPath()
          ctx.roundRect(x + 1, y, barW - 2, barH, 2)
          ctx.fill()
        } else {
          ctx.fillRect(x + 1, y, barW - 2, barH)
        }
      }
      ctx.globalAlpha = 1
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [getFrequencyData, width, height, bars, color, rounded])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}
