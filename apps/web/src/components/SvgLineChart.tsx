/**
 * 极简 SVG 折线图 / 面积图 — 零依赖
 * 支持堆叠多条线，自动缩放 Y 轴。
 */

interface Props {
  data: { label: string; value: number }[]
  height?: number
  color?: string
  fill?: boolean
  showDots?: boolean
  formatValue?: (v: number) => string
  id?: string
}

export default function SvgLineChart({
  data,
  height = 140,
  color = 'var(--accent)',
  fill = true,
  showDots = true,
  formatValue,
}: Props) {
  if (data.length === 0) {
    return (
      <div className="text-sm text-[var(--fg-tertiary)] italic py-8 text-center">No data yet</div>
    )
  }

  const W = 640
  const H = height
  const padL = 32
  const padR = 12
  const padT = 8
  const padB = 24
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const maxV = Math.max(...data.map((d) => d.value), 1)
  const yMax = niceMax(maxV)

  const x = (i: number) => padL + (data.length === 1 ? innerW / 2 : (innerW * i) / (data.length - 1))
  const y = (v: number) => padT + innerH - (innerH * v) / yMax

  // path
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`

  // y-axis gridlines
  const ticks = 4

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }} role="img" aria-label="Chart">
      {/* gridlines */}
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const v = (yMax * i) / ticks
        const yy = y(v)
        return (
          <g key={i}>
            <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="var(--border-subtle)" strokeWidth={1} />
            <text x={padL - 4} y={yy + 3} textAnchor="end" fontSize={9} fill="var(--fg-tertiary)">
              {formatValue ? formatValue(v) : Number.isInteger(v) ? v : v.toFixed(1)}
            </text>
          </g>
        )
      })}

      {/* area */}
      {fill && <path d={areaPath} fill={color} opacity={0.08} />}

      {/* line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" />

      {/* dots */}
      {showDots &&
        data.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.value)} r={2.5} fill={color} />
        ))}

      {/* x labels (最多 8 个) */}
      {data.map((d, i) => {
        const step = Math.max(1, Math.ceil(data.length / 8))
        if (i % step !== 0 && i !== data.length - 1) return null
        return (
          <text key={i} x={x(i)} y={H - 4} textAnchor="middle" fontSize={9} fill="var(--fg-tertiary)">
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}

function niceMax(v: number): number {
  if (v <= 5) return 5
  const pow = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / pow
  let nice: number
  if (n <= 1) nice = 1
  else if (n <= 2) nice = 2
  else if (n <= 5) nice = 5
  else nice = 10
  return nice * pow
}
