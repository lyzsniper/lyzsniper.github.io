import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
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
import BackgroundFX from '@/components/BackgroundFX'

const SkillGraph3D = lazy(() => import('@/components/SkillGraph3D'))

const expertise = [
  'RAG 知识工程',
  'MCP / A2A 协议',
  '多智能体编排',
  '企业级 LLM 应用',
  'Agent 架构设计',
]

interface Skill {
  title: string
  desc: string
  tags: string[]
}

interface SkillCategory {
  icon: LucideIcon
  name: string
  items: Skill[]
}

const skillCategories: SkillCategory[] = [
  {
    icon: Bot,
    name: 'AI 工程',
    items: [
      {
        title: 'RAG 与知识检索',
        desc: '构建企业级知识检索流水线，覆盖 RAG、MCP、Skills、A2A 等协议与 LlamaIndex、Haystack 等框架',
        tags: ['RAG', 'MCP', 'A2A', 'LlamaIndex', 'Haystack'],
      },
      {
        title: '多 Agent 编排',
        desc: '熟悉 ReAct、Plan-Execute、Multi-Agent Debate 等设计模式，落地协作型智能体',
        tags: ['ReAct', 'Plan-Execute', 'Multi-Agent'],
      },
      {
        title: 'Agent 研发框架',
        desc: 'CrewAI、LangGraph、LangChain、Dify、Coze 等框架与编排平台的工程实践',
        tags: ['CrewAI', 'LangGraph', 'Dify', 'Coze'],
      },
      {
        title: 'LLM 微调与推理',
        desc: '主导团队 AI 编程规范制定，落地 Claude Code、Cursor、Qwen、vLLM 等工具链',
        tags: ['Qwen', 'vLLM', 'Claude Code'],
      },
    ],
  },
  {
    icon: Server,
    name: '后端工程',
    items: [
      {
        title: 'Java 企业级开发',
        desc: 'Spring Boot / Cloud 全家桶，深入 JVM 调优与高并发设计，支撑业务稳定运行',
        tags: ['Java', 'Spring Boot', 'Spring Cloud', 'JVM'],
      },
      {
        title: 'Python AI 服务',
        desc: 'FastAPI / Flask 构建 AI 服务，结合 LangChain 编排 LLM 调用',
        tags: ['Python', 'FastAPI', 'LangChain'],
      },
      {
        title: '数据库与缓存',
        desc: 'MySQL、PostgreSQL 关系存储，Redis、ElasticSearch、Milvus 检索与缓存',
        tags: ['MySQL', 'PostgreSQL', 'Redis', 'ES', 'Milvus'],
      },
      {
        title: '消息与中间件',
        desc: 'Kafka、RocketMQ 高吞吐消息系统，Tugraph 图数据库在业务场景的应用',
        tags: ['Kafka', 'RocketMQ', 'Tugraph'],
      },
    ],
  },
  {
    icon: Layers,
    name: '前端工程',
    items: [
      {
        title: 'React 生态',
        desc: 'React 18 + TypeScript + Vite + Tailwind，深度使用 Hooks 与状态管理',
        tags: ['React', 'TypeScript', 'Vite', 'Tailwind'],
      },
      {
        title: 'Vue 企业级',
        desc: 'Vue 3 + Pinia + Vite，建设企业级中后台系统',
        tags: ['Vue 3', 'Pinia', 'Element Plus'],
      },
    ],
  },
  {
    icon: Wrench,
    name: 'DevOps 与工具',
    items: [
      {
        title: '容器化与编排',
        desc: 'Docker 镜像构建，K8s 应用部署与日常运维',
        tags: ['Docker', 'Kubernetes'],
      },
      {
        title: 'CI/CD 与监控',
        desc: 'Jenkins、GitLab CI 流水线，Prometheus + Grafana 监控体系',
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
  return (
    <>
      <BackgroundFX />

      {/* ===== HERO ===== */}
      <section className="container-page pt-16 md:pt-24 pb-20 md:pb-28">
        <div className="max-w-3xl">
          <div className="eyebrow mb-6 reveal">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            AI Agent Engineer · Backend Architect
          </div>

          <h1 className="reveal text-display-xl text-[var(--fg-primary)] mb-6">
            我设计能在生产环境跑起来的智能体系统。
          </h1>

          <p className="reveal text-body-lg text-[var(--fg-secondary)] max-w-xl mb-8">
            在 RAG、Agent 协议、LLM 推理与企业级后端架构的交界处，
            <br />
            把 Demo 变成可被运维的工程。
          </p>

          <div className="reveal flex flex-wrap gap-2 mb-10">
            {expertise.map((t) => (
              <span key={t} className="pill">
                {t}
              </span>
            ))}
          </div>

          <div className="reveal flex items-center gap-3 flex-wrap">
            <Link to="/blog" className="btn btn-primary">
              阅读博客 <ArrowRight size={14} />
            </Link>
            <a href="mailto:jensenlyz@163.com" className="btn btn-secondary">
              <Mail size={14} /> 联系我
            </a>
          </div>
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section className="container-page py-16 md:py-24" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-10 md:gap-16 items-start">
          <div className="reveal">
            <div className="eyebrow mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              关于
            </div>
            <div className="avatar-squircle w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center text-white text-4xl font-semibold tracking-tight">
              JZ
            </div>
          </div>

          <div className="reveal space-y-5 text-body text-[var(--fg-secondary)] max-w-2xl">
            <p>
              你好，我是<strong className="text-[var(--fg-primary)] font-semibold">刘酝泽（Jensen）</strong>。
              我设计过从 RAG 检索到 Agent 编排的完整工程链路，
              也在 ToB、平台型、垂直行业信息化三类场景里做过从 0 到 1 的项目。
            </p>
            <p>
              关注 Agent 设计模式、协议标准、推理优化；
              更关注这些技术能不能被一个团队持续维护。
            </p>
          </div>
        </div>
      </section>

      {/* ===== SKILLS ===== */}
      <section className="container-page py-16 md:py-24" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="reveal mb-12">
          <div className="eyebrow mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            技术栈
          </div>
          <h2 className="text-display-lg text-[var(--fg-primary)] max-w-xl">
            从 AI Agent 到企业级工程化。
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
                <span className="text-sm text-[var(--fg-tertiary)]">加载 3D 知识图谱…</span>
              </div>
            }
          >
            <SkillGraph3D />
          </Suspense>
          <p className="mt-3 text-xs text-[var(--fg-tertiary)] text-center">
            节点大小表示使用深度 · 颜色区分领域 · 线条表示实际关联
          </p>
        </div>

        <div className="space-y-12">
          {skillCategories.map((cat) => {
            const Icon = cat.icon
            return (
              <div key={cat.name} className="reveal">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
                    <Icon size={18} strokeWidth={1.75} />
                  </div>
                  <h3 className="text-display-sm text-[var(--fg-primary)]">{cat.name}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cat.items.map((item) => (
                    <article key={item.title} className="surface-card-interactive p-5">
                      <h4 className="text-base font-semibold text-[var(--fg-primary)] mb-2">{item.title}</h4>
                      <p className="text-body-sm text-[var(--fg-secondary)] leading-relaxed mb-4">
                        {item.desc}
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
            能力域
          </div>
          <h2 className="text-display-lg text-[var(--fg-primary)] max-w-xl">
            按问题类型组织，不按时间堆叠。
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
                  {c.title}
                </h3>
              </div>
              <p className="text-body text-[var(--fg-secondary)] leading-relaxed mb-4 pl-[calc(0.75rem+1.5rem)]">
                {c.stance}
              </p>
              {c.evidence.length > 0 && (
                <ul className="space-y-2 pl-[calc(0.75rem+1.5rem)]">
                  {c.evidence.map((e) => (
                    <li
                      key={e}
                      className="text-body-sm text-[var(--fg-tertiary)] leading-relaxed flex gap-3"
                    >
                      <span className="text-[var(--accent)] shrink-0">·</span>
                      <span>{e}</span>
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
            核心优势
          </div>
          <h2 className="text-display-lg text-[var(--fg-primary)] max-w-2xl">
            我对工程问题的三个长期判断。
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
                className="text-display-md text-[var(--fg-primary)] leading-snug mb-6 pl-[calc(0.75rem+1.5rem)]"
                style={{ letterSpacing: '-0.02em' }}
              >
                "{p.quote}"
              </blockquote>
              <p className="text-body text-[var(--fg-secondary)] leading-relaxed pl-[calc(0.75rem+1.5rem)] max-w-2xl">
                {p.argument}
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
              聊聊 AI Agent 架构
            </h2>
            <p className="text-body text-[var(--fg-secondary)] leading-relaxed">
              欢迎交流企业级 LLM 应用、智能体编排、全栈技术，
              或者任何有意思的项目想法。
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a href="mailto:jensenlyz@163.com" className="btn btn-primary">
              <Mail size={14} /> 邮件联系
            </a>
            <a
              href="https://github.com/lyzsniper"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <Github size={14} /> GitHub
            </a>
          </div>
        </div>
      </section>
    </>
  )
}