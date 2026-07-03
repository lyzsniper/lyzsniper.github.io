import { useMemo, useRef, useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Text, Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useTranslation } from 'react-i18next'
import { nodes as graphNodes, links as graphLinks, type GraphNode, type GraphLink } from '@/data/skillGraph'

interface LayoutNode extends GraphNode {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
}

/**
 * 类别在 Z 轴上的"前后"顺序 — 决定初始布局朝向
 * 数值越大越靠前（朝相机方向）
 */
const CATEGORY_Z_BIAS: Record<GraphNode['category'], number> = {
  ai: 6,        // AI Agent 核心（最前）
  rag: 5,       // RAG 与知识工程
  llm: 4,       // LLM 推理与训练
  backend: 1,   // 后端工程
  data: 0,      // 数据与中间件
  frontend: -1, // 前端工程
  devops: -4,   // DevOps 与云原生
  security: -6, // 安全与质量（最后）
}

function computeLayout(): LayoutNode[] {
  const N = graphNodes.length
  const pos = graphNodes.map((n, i) => {
    // 按 category 分簇初始化：在 XY 平面上散开，Z 轴按类别偏置
    const phi = Math.acos(-1 + (2 * i) / N)
    const theta = Math.sqrt(N * Math.PI) * phi
    const r = 5
    return {
      ...n,
      x: r * Math.cos(theta) * Math.sin(phi),
      y: r * Math.sin(theta) * Math.sin(phi) * 0.7, // Y 轴压扁一点，横向更宽
      z: r * Math.cos(phi) * 0.6 + CATEGORY_Z_BIAS[n.category],
      vx: 0,
      vy: 0,
      vz: 0,
    }
  })

  const idIdx = new Map(graphNodes.map((n, i) => [n.id, i]))
  const linkPairs = graphLinks
    .map((l) => [idIdx.get(l.source)!, idIdx.get(l.target)!])
    .filter(([a, b]) => a !== undefined && b !== undefined) as [number, number][]

  const STEPS = 220
  const REPULSE = 1.8
  const LINK_K = 0.04
  const CENTER_K = 0.008
  const DAMP = 0.85

  for (let step = 0; step < STEPS; step++) {
    const t = 1 - step / STEPS // 冷却
    for (let i = 0; i < N; i++) {
      let fx = 0, fy = 0, fz = 0
      // 中心引力
      fx -= pos[i]!.x * CENTER_K
      fy -= pos[i]!.y * CENTER_K
      fz -= pos[i]!.z * CENTER_K

      // 节点互斥
      for (let j = 0; j < N; j++) {
        if (i === j) continue
        const dx = pos[i]!.x - pos[j]!.x
        const dy = pos[i]!.y - pos[j]!.y
        const dz = pos[i]!.z - pos[j]!.z
        const d2 = dx * dx + dy * dy + dz * dz + 0.01
        const f = (REPULSE * (pos[i]!.weight + pos[j]!.weight) * 0.5) / d2
        const d = Math.sqrt(d2)
        fx += (dx / d) * f
        fy += (dy / d) * f
        fz += (dz / d) * f
      }
      pos[i]!.vx = (pos[i]!.vx + fx) * DAMP
      pos[i]!.vy = (pos[i]!.vy + fy) * DAMP
      pos[i]!.vz = (pos[i]!.vz + fz) * DAMP
    }
    // 连接引力
    for (const [a, b] of linkPairs) {
      const dx = pos[b]!.x - pos[a]!.x
      const dy = pos[b]!.y - pos[a]!.y
      const dz = pos[b]!.z - pos[a]!.z
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01
      const target = 3
      const force = (d - target) * LINK_K
      pos[a]!.vx += (dx / d) * force
      pos[a]!.vy += (dy / d) * force
      pos[a]!.vz += (dz / d) * force
      pos[b]!.vx -= (dx / d) * force
      pos[b]!.vy -= (dy / d) * force
      pos[b]!.vz -= (dz / d) * force
    }
    // 应用速度
    for (let i = 0; i < N; i++) {
      pos[i]!.x += pos[i]!.vx * t
      pos[i]!.y += pos[i]!.vy * t
      pos[i]!.z += pos[i]!.vz * t
    }
  }
  return pos
}

const CATEGORY_COLOR: Record<GraphNode['category'], string> = {
  ai: '#4f46e5',      // indigo — Agent 核心
  rag: '#7c3aed',     // violet — RAG 知识工程
  llm: '#8b5cf6',     // purple — LLM 推理
  backend: '#10b981', // emerald — 后端
  data: '#06b6d4',    // cyan — 数据
  frontend: '#f59e0b', // amber — 前端
  devops: '#ec4899',  // pink — DevOps
  security: '#ef4444', // red — 安全
}

function NodeMesh({
  node,
  label,
  isHovered,
  isSelected,
  onPointer,
}: {
  node: LayoutNode
  label: string
  isHovered: boolean
  isSelected: boolean
  onPointer: (e: THREE.Intersection | null) => void
}) {
  const color = CATEGORY_COLOR[node.category]
  const size = 0.12 + node.weight * 0.08
  const scale = isHovered ? 1.4 : isSelected ? 1.25 : 1
  return (
    <group position={[node.x, node.y, node.z]} scale={scale}>
      {/* 发光球 */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation()
          onPointer(e)
        }}
        onPointerOut={() => onPointer(null)}
      >
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 0.9 : 0.5}
          roughness={0.3}
          metalness={0.1}
          transparent
          opacity={isHovered || isSelected ? 1 : 0.9}
        />
      </mesh>
      {/* 外环 */}
      {(isHovered || isSelected) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.6, size * 1.75, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* 标签 */}
      <Text
        position={[0, size + 0.25, 0]}
        fontSize={isHovered ? 0.32 : 0.26}
        color={isHovered ? '#ffffff' : 'rgba(255,255,255,0.85)'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor="#000000"
        outlineBlur={0.005}
      >
        {label}
      </Text>
    </group>
  )
}

function Edge({ a, b, isHighlighted }: { a: LayoutNode; b: LayoutNode; isHighlighted: boolean }) {
  const points = useMemo(
    () => [new THREE.Vector3(a.x, a.y, a.z), new THREE.Vector3(b.x, b.y, b.z)],
    [a.x, a.y, a.z, b.x, b.y, b.z],
  )
  return (
    <Line
      points={points}
      color={isHighlighted ? '#4f46e5' : '#ffffff'}
      lineWidth={isHighlighted ? 1.5 : 0.5}
      transparent
      opacity={isHighlighted ? 0.8 : 0.18}
    />
  )
}

function Scene() {
  const { t } = useTranslation('home')
  const layout = useMemo(() => computeLayout(), [])
  const idIdx = useMemo(() => new Map(layout.map((n, i) => [n.id, i])), [layout])
  const linkPairs = useMemo(
    () =>
      graphLinks
        .map((l) => {
          const a = idIdx.get(l.source)
          const b = idIdx.get(l.target)
          return a !== undefined && b !== undefined ? { a, b, type: l.type as GraphLink['type'] } : null
        })
        .filter((x): x is { a: number; b: number; type: GraphLink['type'] } => x !== null),
    [idIdx],
  )

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)

  // 计算布局的包围球，自动调整相机距离
  useEffect(() => {
    const box = new THREE.Box3()
    for (const n of layout) {
      box.expandByPoint(new THREE.Vector3(n.x, n.y, n.z))
    }
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const radius = Math.max(size.x, size.y, size.z) * 0.6

    // 把场景 group 移到中心
    // 这里我们通过 camera 看向中心，距离 = radius / tan(fov/2)
    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180)
    const distance = radius / Math.tan(fov / 2)
    camera.position.set(center.x, center.y, center.z + distance * 1.1)
    camera.lookAt(center)
    camera.updateProjectionMatrix()
    if (controlsRef.current) {
      controlsRef.current.target.copy(center)
      controlsRef.current.update()
    }
  }, [layout, camera])

  const connectedIds = useMemo(() => {
    if (!hoveredId) return new Set<string>()
    const set = new Set<string>([hoveredId])
    for (const { a, b } of linkPairs) {
      const idA = layout[a]!.id
      const idB = layout[b]!.id
      if (idA === hoveredId) set.add(idB)
      if (idB === hoveredId) set.add(idA)
    }
    return set
  }, [hoveredId, linkPairs, layout])

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#4f46e5" />
      <group>
        {linkPairs.map(({ a, b }, i) => {
          const idA = layout[a]!.id
          const idB = layout[b]!.id
          const highlighted = !hoveredId || (connectedIds.has(idA) && connectedIds.has(idB))
          return <Edge key={i} a={layout[a]!} b={layout[b]!} isHighlighted={highlighted} />
        })}
        {layout.map((n) => (
          <NodeMesh
            key={n.id}
            node={n}
            label={t(`skillGraph.label.${n.id}`, { defaultValue: n.label })}
            isHovered={hoveredId === n.id}
            isSelected={connectedIds.has(n.id)}
            onPointer={(e) => setHoveredId(e ? n.id : null)}
          />
        ))}
      </group>
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
        minDistance={5}
        maxDistance={40}
      />
    </>
  )
}

export default function SkillGraph3D() {
  const { t } = useTranslation('home')
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: '460px',
        borderRadius: '16px',
        background:
          'linear-gradient(180deg, #0a0a0a 0%, #141414 100%)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 18], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#0a0a0a']} />
        <Scene />
      </Canvas>

      {/* 角落装饰 */}
      <div className="absolute top-3 left-4 text-[10px] font-mono uppercase tracking-wider text-white/40 pointer-events-none">
        Skill Graph · 3D
      </div>
      <div className="absolute bottom-3 right-4 text-[10px] font-mono text-white/40 pointer-events-none">
        {graphNodes.length} nodes · {graphLinks.length} edges
      </div>

      {/* 图例 */}
      <div className="absolute top-3 right-4 flex flex-col gap-1 text-[10px] font-mono text-white/70 pointer-events-none">
        <LegendDot color={CATEGORY_COLOR.ai} label={t('skillGraph.legend.ai')} />
        <LegendDot color={CATEGORY_COLOR.rag} label={t('skillGraph.legend.rag')} />
        <LegendDot color={CATEGORY_COLOR.llm} label={t('skillGraph.legend.llm')} />
        <LegendDot color={CATEGORY_COLOR.backend} label={t('skillGraph.legend.backend')} />
        <LegendDot color={CATEGORY_COLOR.data} label={t('skillGraph.legend.data')} />
        <LegendDot color={CATEGORY_COLOR.frontend} label={t('skillGraph.legend.frontend')} />
        <LegendDot color={CATEGORY_COLOR.devops} label={t('skillGraph.legend.devops')} />
        <LegendDot color={CATEGORY_COLOR.security} label={t('skillGraph.legend.security')} />
      </div>

      {/* 提示 */}
      <div className="absolute bottom-3 left-4 text-[10px] text-white/40 pointer-events-none">
        {t('skillGraph.hint')}
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <span>{label}</span>
    </div>
  )
}