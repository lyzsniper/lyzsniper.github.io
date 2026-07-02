import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bot,
  Server,
  Layers,
  Wrench,
  Sparkles,
  Trophy,
  Target,
  TrendingUp,
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

interface Project {
  period: string
  title: string
  role: string
  desc: string
  impact: string
  tech: string[]
}

const projects: Project[] = [
  {
    period: '2024.03 — 2025.06',
    title: '企业智能研发助手',
    role: 'AI Agent 工程师',
    desc: '面向企业应用的 AI 智能助手，融合 RAG、Agent、MCP 技术实现对域内服务的深度理解。主导设计 MCP 构建基于 Function Calling 的动态工具调用与多智能体执行体系。',
    impact: '覆盖 6 个业务域，研发提效 47%',
    tech: ['Spring AI', 'MCP', 'ElasticSearch', 'Tugraph', 'Haystack'],
  },
  {
    period: '2024.03 — 2024.07',
    title: 'Serverless 场景管控平台',
    role: 'AI Agent 工程师',
    desc: '引入 LLM 代码语义比对能力，结合 RAG 构建架构规范知识库，精准拦截高危变更。通过 Plan-Execute-Review 智能体编排，推动交付效率提升。',
    impact: '拦截 200+ 高危变更，交付效率 ×4',
    tech: ['Java', 'Spring AI', 'LangChain4j', 'Semantic Diff'],
  },
  {
    period: '2022.06 — 2024.03',
    title: 'AI + 超声放射信息系统',
    role: '后端开发工程师',
    desc: '面向医院超声科室的智能化信息系统，结合大模型技术引入智能导诊、AI 辅助电子报告生成及历史病历对比功能。独立设计 AI 网关层，实现业务服务与 AI 推理服务的高效解耦。',
    impact: '服务 12 家三甲医院',
    tech: ['Milvus', 'Langchain', 'RocketMQ', 'Redis'],
  },
  {
    period: '2021.03 — 2022.06',
    title: '基础研发平台',
    role: '后端开发工程师',
    desc: '公司级基础研发平台建设，统一日志、监控、配置中心。推动团队工程效能提升，规范 CI/CD 流程。',
    impact: '接入 200+ 应用',
    tech: ['Java', 'Spring Cloud', 'Kafka', 'Docker'],
  },
]

const advantages = [
  {
    icon: Trophy,
    title: '全周期最高绩效',
    desc: '在东华医为、数字马力、泛联新安三家公司所有绩效周期内均获得 A / A++ 评级，是业务部门核心开发人员。',
  },
  {
    icon: Target,
    title: 'BU AI 专项负责人',
    desc: '主导 AI 辅助编程工具引入与使用规范制定，推动代码生成、自动化测试用例编写等场景落地。',
  },
  {
    icon: TrendingUp,
    title: '效率与团队建设',
    desc: '主导内部技术分享 20+ 场，建立代码 Review 机制、CI/CD 规范及技术债务治理方案。',
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
            AI Agent 工程师 · 全栈开发者
          </div>

          <h1 className="reveal text-display-xl text-[var(--fg-primary)] mb-6">
            你好，我是刘酝泽。
            <br />
            <span className="text-[var(--fg-tertiary)]">我构建企业级智能体系统。</span>
          </h1>

          <p className="reveal text-body-lg text-[var(--fg-secondary)] max-w-xl mb-8">
            5 年深耕企业级 AI 应用，从 RAG 知识工程到多智能体编排，
            主导过医疗、企业研发、Serverless 管控等多个 0→1 项目。
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
              你好，我是<strong className="text-[var(--fg-primary)] font-semibold">刘酝泽（Jensen）</strong>，
              一名 AI Agent 工程师与全栈开发者，目前专注于企业级智能体研发平台建设。
            </p>
            <p>
              5 年后端开发与 AI 工程经验，从单体应用到微服务架构，从传统 Java
              企业级开发到 LLM 驱动的智能体系统建设。主导设计了企业内部 MCP 工具调用体系、
              Serverless 智能管控平台、AI 辅助医疗信息系统等多个项目。
            </p>
            <p>
              持续关注前沿 AI 技术：Agent 设计模式（ReAct、Plan-Execute、Multi-Agent Debate）、
              MCP / A2A 协议、LLM 微调与推理优化。
              热衷于把技术能力转化为实际业务价值。
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

      {/* ===== PROJECTS — zig-zag bento ===== */}
      <section className="container-page py-16 md:py-24" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="reveal mb-12">
          <div className="eyebrow mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            代表项目
          </div>
          <h2 className="text-display-lg text-[var(--fg-primary)] max-w-xl">
            从医疗 AI 到企业 Agent 平台。
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {projects.map((p, idx) => (
            <article
              key={p.title}
              className={`reveal surface-card-interactive p-6 flex flex-col ${
                idx === 0 || idx === 3 ? 'md:col-span-3' : 'md:col-span-3'
              }`}
            >
              <div className="flex items-center justify-between mb-3 text-xs text-[var(--fg-tertiary)]">
                <span className="font-mono">{p.period}</span>
                <span className="pill !h-5 !text-[10px] pill-accent">{p.role}</span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-2">{p.title}</h3>
              <p className="text-body-sm text-[var(--fg-secondary)] leading-relaxed mb-4 flex-1">
                {p.desc}
              </p>
              <div className="flex items-center gap-2 mb-4 text-xs">
                <Sparkles size={12} className="text-[var(--accent)]" />
                <span className="font-medium text-[var(--fg-primary)]">{p.impact}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.tech.map((t) => (
                  <span key={t} className="pill !h-5 !text-[11px]">
                    {t}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ===== ADVANTAGES ===== */}
      <section className="container-page py-16 md:py-24" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="reveal mb-12">
          <div className="eyebrow mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            核心优势
          </div>
          <h2 className="text-display-lg text-[var(--fg-primary)] max-w-xl">
            技术 + 业务 + 团队三位一体。
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {advantages.map((a) => {
            const Icon = a.icon
            return (
              <article key={a.title} className="reveal surface-card p-6">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] mb-4">
                  <Icon size={18} strokeWidth={1.75} />
                </div>
                <h3 className="text-base font-semibold text-[var(--fg-primary)] mb-2">{a.title}</h3>
                <p className="text-body-sm text-[var(--fg-secondary)] leading-relaxed">
                  {a.desc}
                </p>
              </article>
            )
          })}
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