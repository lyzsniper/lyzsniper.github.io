import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Bot,
  Server,
  Layers,
  Wrench,
  Mail,
  Github,
  type LucideIcon,
} from 'lucide-react'
import { useHead } from '@/lib/useHead'

/** hero 统计数字：count-up 入场（easeOutExpo） */
function StatNum({ target, suffix }: { target: number; suffix: string }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVal(target)
      return
    }
    let raf = 0
    const DURATION = 1400
    const START_DELAY = 700
    const t0 = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0 - START_DELAY) / DURATION))
      setVal(Math.round(target * (1 - Math.pow(2, -10 * p))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target])
  return (
    <div className="stat-num">
      {val}
      <span className="suffix">{suffix}</span>
    </div>
  )
}

const SkillGraph3D = lazy(() => import('@/components/SkillGraph3D'))

const expertise = [
  'RAG / Knowledge Engineering',
  'MCP / A2A',
  'Multi-Agent',
  'LLM',
  'Agent Memory',
]

interface Skill {
  titleKey: string
  descKey: string
  tags: string[]
}

interface SkillCategory {
  icon: LucideIcon
  nameKey: string
  items: Skill[]
}

const skillCategories: SkillCategory[] = [
  {
    icon: Bot,
    nameKey: 'home:skills.categories.ai',
    items: [
      {
        titleKey: 'home:skills.items.rag.title',
        descKey: 'home:skills.items.rag.desc',
        tags: ['RAG', 'MCP', 'A2A', 'LlamaIndex', 'Haystack'],
      },
      {
        titleKey: 'home:skills.items.multiAgent.title',
        descKey: 'home:skills.items.multiAgent.desc',
        tags: ['ReAct', 'Plan-Execute', 'Multi-Agent'],
      },
      {
        titleKey: 'home:skills.items.agentFrameworks.title',
        descKey: 'home:skills.items.agentFrameworks.desc',
        tags: ['CrewAI', 'LangGraph', 'Dify', 'Coze'],
      },
      {
        titleKey: 'home:skills.items.llm.title',
        descKey: 'home:skills.items.llm.desc',
        tags: ['Qwen', 'vLLM', 'Claude Code'],
      },
    ],
  },
  {
    icon: Server,
    nameKey: 'home:skills.categories.backend',
    items: [
      {
        titleKey: 'home:skills.items.java.title',
        descKey: 'home:skills.items.java.desc',
        tags: ['Java', 'Spring Boot', 'Spring Cloud', 'JVM'],
      },
      {
        titleKey: 'home:skills.items.python.title',
        descKey: 'home:skills.items.python.desc',
        tags: ['Python', 'FastAPI', 'LangChain'],
      },
      {
        titleKey: 'home:skills.items.database.title',
        descKey: 'home:skills.items.database.desc',
        tags: ['MySQL', 'PostgreSQL', 'Redis', 'ES', 'Milvus'],
      },
      {
        titleKey: 'home:skills.items.messaging.title',
        descKey: 'home:skills.items.messaging.desc',
        tags: ['Kafka', 'RocketMQ', 'Tugraph'],
      },
    ],
  },
  {
    icon: Layers,
    nameKey: 'home:skills.categories.frontend',
    items: [
      {
        titleKey: 'home:skills.items.react.title',
        descKey: 'home:skills.items.react.desc',
        tags: ['React', 'TypeScript', 'Vite', 'Tailwind'],
      },
      {
        titleKey: 'home:skills.items.vue.title',
        descKey: 'home:skills.items.vue.desc',
        tags: ['Vue 3', 'Pinia', 'Element Plus'],
      },
    ],
  },
  {
    icon: Wrench,
    nameKey: 'home:skills.categories.devops',
    items: [
      {
        titleKey: 'home:skills.items.docker.title',
        descKey: 'home:skills.items.docker.desc',
        tags: ['Docker', 'Kubernetes'],
      },
      {
        titleKey: 'home:skills.items.cicd.title',
        descKey: 'home:skills.items.cicd.desc',
        tags: ['Jenkins', 'Prometheus', 'Grafana'],
      },
    ],
  },
]

interface Capability {
  no: string
  title: string
  stance: string
  evidence: string[]
}

const capabilities: Capability[] = [
  {
    no: '01',
    title: 'RAG & 企业知识工程',
    stance: '让知识库不再只回答"是什么"，而是回答"在我们的业务里怎么做"。',
    evidence: [
      '设计过支持万级文档、6 个业务域、毫秒级召回的检索管线',
      '把 LlamaIndex / Haystack / 自研 Router 拼成可灰度的链路',
    ],
  },
  {
    no: '02',
    title: '多智能体编排',
    stance: 'Agent 不是 Prompt 拼接，是角色、工具、记忆、终止条件的工程设计。',
    evidence: [
      '落地 ReAct / Plan-Execute / Multi-Agent Debate 多种范式',
      '把外部业务封装成 MCP Tools，让 Agent 可观测、可重试',
    ],
  },
  {
    no: '03',
    title: 'LLM 推理与工程化',
    stance: '关注模型能力上限，更关注推理成本、可控性和团队使用规范。',
    evidence: [
      'Qwen / vLLM / Claude Code 在企业环境的落地路径',
      '主导团队 AI 编程工具引入与 Code Review 机制',
    ],
  },
  {
    no: '04',
    title: '企业级后端架构',
    stance: '不相信"AI 项目"可以脱离传统软件工程。Spring Boot / JVM 是基本盘。',
    evidence: [
      '高并发网关、消息中间件、图数据库在 ToB 业务的真实承载',
      '从单体到微服务、从代码到 CI/CD 的全周期治理',
    ],
  },
  {
    no: '05',
    title: '跨领域落地能力',
    stance: '在 ToB、ToB-Internal、垂直行业信息化三类场景都做过从 0 到 1。让我能快速判断"这个需求是工程问题还是产品问题"。',
    evidence: [],
  },
]

interface Principle {
  no: string
  quote: string
  argument: string
}

const principles: Principle[] = [
  {
    no: '01',
    quote: '真正难的从来不是让 Agent 跑起来，是让它在生产里不胡说、不超时、不被人绕过。',
    argument:
      '我把每个 Agent 项目都当成一个分布式系统来设计：工具调用要有超时和降级、上下文要有边界、失败要有可重入路径。在 6 个业务域的实践中，这套工程纪律比任何 Prompt 技巧都更可靠。',
  },
  {
    no: '02',
    quote: '我倾向于做"减法架构"——用 3 个组件能解决的事，绝不用 5 个。',
    argument:
      'LangGraph / CrewAI / Dify / Coze 我都用过，最后的判断标准始终是：能否在三个月后，团队里第二个人能看懂、能改、能上线。复杂度必须可被继承，不是炫技。',
  },
  {
    no: '03',
    quote: '技术决策的终点不是"能不能做"，是"值不值得维护"。',
    argument:
      '主导过公司级研发平台接入 200+ 应用、内部技术分享 20+ 场。我相信工程师的影响力 = 你写的代码 × 别人因为你能少写的代码。',
  },
]

export default function Home() {
  const { t, i18n } = useTranslation(['common', 'home'])

  const isEn = i18n.language?.startsWith('en')
  useHead({
    title: t('home:seo.title'),
    description: t('home:seo.description'),
    type: 'website',
    canonical: isEn ? '/en' : '/',
    hreflang: [
      { lang: 'zh', url: '/' },
      { lang: 'en', url: '/en' },
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: '刘酝泽',
      url: window.location.origin,
      description: t('home:seo.description'),
      mainEntity: {
        '@type': 'Person',
        name: '刘酝泽',
        jobTitle: 'AI Agent 架构师',
        url: window.location.origin,
      },
    },
  })

  const heroRef = useRef<HTMLElement>(null)

  // hero 逐字/逐词入场：挂载后加 .play 触发
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => el.classList.add('play')),
    )
    return () => cancelAnimationFrame(raf)
  }, [])

  // 中文逐字、英文逐词；连续的 ASCII 字母/数字聚合为词，避免单词内断行
  const isZh = !i18n.language?.startsWith('en')
  const splitTitle = (s: string): string[] => {
    if (!isZh) {
      return s.split(' ').map((w, i, arr) => (i < arr.length - 1 ? `${w}\u00A0` : w))
    }
    const tokens: string[] = []
    let buf = ''
    for (const c of Array.from(s)) {
      if (/[A-Za-z0-9]/.test(c)) {
        buf += c
        continue
      }
      if (buf) {
        tokens.push(buf)
        buf = ''
      }
      tokens.push(c === ' ' ? '\u00A0' : c)
    }
    if (buf) tokens.push(buf)
    return tokens
  }
  const titleA = splitTitle(t('home:hero.h1a'))
  const titleB = splitTitle(t('home:hero.h1b'))

  // hero 统计带（i18n 返回对象数组）
  const heroStats = t('home:hero.stats', { returnObjects: true }) as {
    num: number
    suffix: string
    label: string
  }[]

  return (
    <>
      {/* ===== HERO（全屏透明舞台：浮在全局星座场上，左下锚定） ===== */}
      <section ref={heroRef} className="hero-stage">
        <div className="hero-content container-page">
          <div className="max-w-3xl">
            <div className="hero-eyebrow reveal">
              <span className="dot" />
              {t('home:hero.eyebrow')}
            </div>

            <h1
              className="hero-h1 mt-5 mb-5"
              aria-label={`${t('home:hero.h1a')}${t('home:hero.h1b')}`}
            >
              {titleA.map((ch, i) => (
                <span
                  key={`a-${i}`}
                  className="w"
                  style={{ transitionDelay: `${100 + i * 55}ms` }}
                  aria-hidden="true"
                >
                  {ch}
                </span>
              ))}
              <span className="accent">
                {titleB.map((ch, i) => (
                  <span
                    key={`b-${i}`}
                    className="w"
                    style={{ transitionDelay: `${100 + (titleA.length + i) * 55}ms` }}
                    aria-hidden="true"
                  >
                    {ch}
                  </span>
                ))}
              </span>
            </h1>

            <p className="hero-sub reveal mb-7" style={{ transitionDelay: '0.3s' }}>
              {t('home:hero.subtitle')}
            </p>

            <div className="reveal flex flex-wrap gap-2 mb-9" style={{ transitionDelay: '0.45s' }}>
              {expertise.map((tag) => (
                <span key={tag} className="pill pill-ghost-dark">
                  {tag}
                </span>
              ))}
            </div>

            <div className="reveal flex items-center gap-3 flex-wrap" style={{ transitionDelay: '0.6s' }}>
              <Link to="/blog" className="btn btn-primary btn-gradient">
                {t('home:hero.ctaBlog')} <ArrowRight size={14} />
              </Link>
              <a href="mailto:jensenlyz@163.com" className="btn btn-ghost-dark">
                <Mail size={14} /> {t('home:hero.ctaContact')}
              </a>
            </div>

            <div className="stats-band reveal" style={{ transitionDelay: '0.75s' }}>
              {heroStats.map((s, i) => (
                <div key={i} className="stat">
                  <StatNum target={s.num} suffix={s.suffix} />
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="scroll-cue" aria-hidden="true">
          {t('home:hero.scroll')}
          <span className="line" />
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section className="container-page py-16 md:py-24" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-10 md:gap-16 items-start">
          <div className="reveal">
            <div className="eyebrow mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              {t('home:about.eyebrow')}
            </div>
            <img
              src="/量子港.png"
              alt={t('home:about.eyebrow')}
              loading="eager"
              decoding="async"
              className="w-32 h-32 md:w-40 md:h-40 object-cover ring-1 ring-[var(--border-subtle)] transition-transform duration-500 ease-out hover:scale-[1.02]"
              style={{ boxShadow: 'var(--shadow-card)', borderRadius: '12px' }}
            />
          </div>

          <div className="reveal space-y-5 text-body text-[var(--fg-secondary)] max-w-2xl">
            <p>
              {t('home:about.p1')}
            </p>
            <p>
              {t('home:about.p2')}
            </p>
          </div>
        </div>
      </section>

      {/* ===== SKILLS ===== */}
      <section className="container-page py-16 md:py-24" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="reveal mb-12">
          <div className="eyebrow mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            {t('home:skills.eyebrow')}
          </div>
          <h2 className="text-display-lg text-[var(--fg-primary)] max-w-xl">
            {t('home:skills.h2')}
          </h2>
        </div>

        {/* 3D 知识图谱 */}
        <div className="reveal mb-12">
          <Suspense
            fallback={
              <div
                className="w-full flex items-center justify-center"
                style={{
                  height: '440px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--bg-muted)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span className="text-sm text-[var(--fg-tertiary)]">{t('home:skills.graphLoading')}</span>
              </div>
            }
          >
            <SkillGraph3D />
          </Suspense>
          <p className="mt-3 text-xs text-[var(--fg-tertiary)] text-center">
            {t('home:skills.graphNote')}
          </p>
        </div>

        <div className="space-y-12">
          {skillCategories.map((cat) => {
            const Icon = cat.icon
            return (
              <div key={cat.nameKey} className="reveal">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
                    <Icon size={18} strokeWidth={1.75} />
                  </div>
                  <h3 className="text-display-sm text-[var(--fg-primary)]">{t(cat.nameKey)}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cat.items.map((item) => (
                    <article key={item.titleKey} className="surface-card-interactive p-5">
                      <h4 className="text-base font-semibold text-[var(--fg-primary)] mb-2">{t(item.titleKey)}</h4>
                      <p className="text-body-sm text-[var(--fg-secondary)] leading-relaxed mb-4">
                        {t(item.descKey)}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.tags.map((t) => (
                          <span key={t} className="pill !h-5 !text-[11px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ===== CAPABILITIES ===== */}
      <section className="container-page py-16 md:py-24" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="reveal mb-12">
          <div className="eyebrow mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            {t('home:capabilities.eyebrow')}
          </div>
          <h2 className="text-display-lg text-[var(--fg-primary)] max-w-xl">
            {t('home:capabilities.h2')}
          </h2>
        </div>

        <div className="max-w-3xl space-y-16">
          {capabilities.map((c) => (
            <article key={c.no} className="reveal">
              <div className="flex items-baseline gap-6 mb-3">
                <span className="text-caption font-mono text-[var(--fg-quaternary)] shrink-0">
                  {c.no}
                </span>
                <h3 className="text-display-sm text-[var(--fg-primary)]">
                  {t(`home:capabilities.items.${c.no}.title`)}
                </h3>
              </div>
              <p className="text-body text-[var(--fg-secondary)] leading-relaxed mb-4 pl-[calc(0.75rem+1.5rem)]">
                {t(`home:capabilities.items.${c.no}.stance`)}
              </p>
              {c.evidence.length > 0 && (
                <ul className="space-y-2 pl-[calc(0.75rem+1.5rem)]">
                  {c.evidence.map((_, idx) => (
                    <li
                      key={idx}
                      className="text-body-sm text-[var(--fg-tertiary)] leading-relaxed flex gap-3"
                    >
                      <span className="text-[var(--accent)] shrink-0">·</span>
                      <span>{t(`home:capabilities.items.${c.no}.evidence.${idx}`)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* ===== PRINCIPLES ===== */}
      <section className="container-page py-16 md:py-24" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="reveal mb-16">
          <div className="eyebrow mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            {t('home:principles.eyebrow')}
          </div>
          <h2 className="text-display-lg text-[var(--fg-primary)] max-w-2xl">
            {t('home:principles.h2')}
          </h2>
        </div>

        <div className="max-w-3xl space-y-16">
          {principles.map((p) => (
            <article key={p.no} className="reveal">
              <div className="flex items-baseline gap-6 mb-5">
                <span className="text-caption font-mono text-[var(--fg-quaternary)] shrink-0">
                  {p.no}
                </span>
              </div>
              <blockquote
                className="text-display-md serif-display text-[var(--fg-primary)] leading-snug mb-6 pl-[calc(0.75rem+1.5rem)]"
                style={{ letterSpacing: '-0.02em' }}
              >
                "{t(`home:principles.items.${p.no}.quote`)}"
              </blockquote>
              <p className="text-body text-[var(--fg-secondary)] leading-relaxed pl-[calc(0.75rem+1.5rem)] max-w-2xl">
                {t(`home:principles.items.${p.no}.argument`)}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ===== CONTACT CTA ===== */}
      <section className="container-page py-20 md:py-28" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div
          className="reveal surface-card p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
          style={{ background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-muted))' }}
        >
          <div className="max-w-lg">
            <h2 className="text-display-md text-[var(--fg-primary)] mb-3">
              {t('home:cta.h2')}
            </h2>
            <p className="text-body text-[var(--fg-secondary)] leading-relaxed">
              {t('home:cta.p')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a href="mailto:jensenlyz@163.com" className="btn btn-primary">
              <Mail size={14} /> {t('home:cta.email')}
            </a>
            <a
              href="https://github.com/lyzsniper"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <Github size={14} /> {t('home:cta.github')}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}