/**
 * 分类 → 视觉映射（颜色即分类法）：
 * 分类 pill 色点、生成封面色相共用同一张表，全站色彩语义一致。
 */

export interface CategoryVisual {
  /** 生成封面色相（hsl hue） */
  hue: number
  /** 色点 / accent 颜色 */
  color: string
}

const CATEGORY_MAP: Record<string, CategoryVisual> = {
  大模型: { hue: 242, color: '#4f46e5' },
  'AI 工程': { hue: 199, color: '#0ea5e9' },
  架构: { hue: 262, color: '#8052ff' },
  随笔: { hue: 28, color: '#f59e0b' },
}

function hashHue(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 360
  return h
}

/** 支持层级分类（"技术/AI" 取顶层匹配），未知分类回退到稳定哈希 */
export function categoryVisual(category: string | null | undefined, seed = ''): CategoryVisual {
  if (category) {
    const top = category.split('/')[0]
    const hit = CATEGORY_MAP[top] ?? CATEGORY_MAP[category]
    if (hit) return hit
    const h = hashHue(category)
    return { hue: h, color: `hsl(${h} 60% 50%)` }
  }
  const h = hashHue(seed || 'default')
  return { hue: h, color: `hsl(${h} 60% 50%)` }
}

/** 生成封面图案的轮换（按分类稳定） */
export function coverPattern(category: string | null | undefined, seed = ''): 'constellation' | 'waves' | 'orbits' {
  const patterns = ['constellation', 'waves', 'orbits'] as const
  const key = (category ?? '') + seed
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 997
  return patterns[h % patterns.length]
}
