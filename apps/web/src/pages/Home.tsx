import { Link } from 'react-router-dom'
import BackgroundFX from '@/components/BackgroundFX'

const heroTags = [
  '🎯 Agent 架构设计',
  '🔧 多智能体系统',
  '🚀 RAG 知识工程',
  '⚡ LLM 微调推理',
  '🌐 MCP 协议',
]

interface Skill {
  title: string
  desc: string
  tags: string[]
}

interface SkillCategory {
  icon: string
  name: string
  items: Skill[]
}

const skillCategories: SkillCategory[] = [
  {
    icon: '🤖',
    name: 'AI 工程',
    items: [
      {
        title: '🔍 RAG / 知识检索增强',
        desc: '熟练运用 RAG、MCP、Skills、A2A 协议及 LlamaIndex 等框架，构建企业级知识检索与增强生成流水线',
        tags: ['RAG', 'MCP', 'A2A', 'LlamaIndex'],
      },
      {
        title: '🧠 多 Agent 协作',
        desc: '熟练掌握 ReAct、Plan-Execute、Multi-Agent Debate/Orchestration 等 Agent 设计模式',
        tags: ['ReAct', 'Plan-Execute', 'Debate'],
      },
      {
        title: '🛠️ Agent 研发框架',
        desc: 'CrewAI、ADK、LangGraph、LangChain 等智能体研发框架，Dify、Coze、Langflow 等编排平台',
        tags: ['CrewAI', 'LangGraph', 'Dify', 'Coze'],
      },
      {
        title: '⚡ LLM 微调与推理',
        desc: '熟练使用 Claude Code、Cursor、Open Code 等主流 AI 编程工具，主导团队 AI 编码规范制定',
        tags: ['Qwen', 'vLLM', 'AWQ'],
      },
    ],
  },
  {
    icon: '🗄️',
    name: '后端工程',
    items: [
      {
        title: 'Java 企业级开发',
        desc: '多年 Java 后端开发经验，Spring Boot / Spring Cloud 全家桶，深入理解 JVM 调优与高并发',
        tags: ['Java', 'Spring Boot', 'Spring Cloud', 'JVM'],
      },
      {
        title: 'Python AI 服务',
        desc: 'FastAPI / Flask 构建 AI 服务，结合 LangChain 编排 LLM 调用',
        tags: ['Python', 'FastAPI', 'LangChain'],
      },
      {
        title: '数据库与缓存',
        desc: 'MySQL、PostgreSQL 关系型数据库，Redis、ElasticSearch、Milvus 检索与缓存',
        tags: ['MySQL', 'PostgreSQL', 'Redis', 'ES', 'Milvus'],
      },
      {
        title: '消息队列与中间件',
        desc: 'Kafka、RocketMQ 高吞吐消息系统，Tugraph 图数据库应用',
        tags: ['Kafka', 'RocketMQ', 'Tugraph'],
      },
    ],
  },
  {
    icon: '🎨',
    name: '前端工程',
    items: [
      {
        title: 'React 全家桶',
        desc: 'React 18 + TypeScript + Vite + Tailwind，深度使用 Hooks 与状态管理',
        tags: ['React', 'TypeScript', 'Vite', 'Tailwind'],
      },
      {
        title: 'Vue 生态',
        desc: 'Vue 3 + Pinia + Vite，企业级中后台系统建设',
        tags: ['Vue 3', 'Pinia', 'Element Plus'],
      },
    ],
  },
  {
    icon: '🛠️',
    name: 'DevOps & 工具',
    items: [
      {
        title: '容器化与编排',
        desc: 'Docker 镜像构建，K8s 应用部署与运维',
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
  icon: string
  period: string
  title: string
  role: string
  desc: string
  tech: string[]
}

const projects: Project[] = [
  {
    icon: '🔮',
    period: '2024-03 ~ 2025-06',
    title: '企业智能研发助手（玲珑 FSD）',
    role: 'AI Agent 工程师',
    desc: '面向企业应用的 AI 智能助手，融合 RAG、Agent、MCP 技术实现对域内服务的深度理解。主导设计 MCP 构建基于 Function Calling 的动态工具调用与多智能体执行体系。',
    tech: ['Spring AI', 'MCP', 'ElasticSearch', 'Tugraph', 'Haystack'],
  },
  {
    icon: '🚀',
    period: '2024-03 ~ 2024-07',
    title: 'Serverless 场景管控平台',
    role: 'AI Agent 工程师',
    desc: '引入 LLM 代码语义比对能力，结合 RAG 构建架构规范知识库，精准拦截 200+ 次高危变更。通过 Plan-Execute-Review 智能体编排，推动交付效率提升 300%。',
    tech: ['Java', 'Spring AI', 'LangChain4j', 'Semantic Diff'],
  },
  {
    icon: '🏥',
    period: '2022-06 ~ 2024-03',
    title: 'AI + 超声放射信息系统',
    role: '后端开发工程师',
    desc: '面向医院超声科室的智能化信息系统，结合大模型技术引入智能导诊、AI 辅助电子报告生成及历史病历对比功能。独立设计 AI 网关层，实现业务服务与 AI 推理服务的高效解耦。',
    tech: ['Milvus', 'Langchain', 'RocketMQ', 'Redis'],
  },
  {
    icon: '⚙️',
    period: '2021-03 ~ 2022-06',
    title: '基础研发平台',
    role: '后端开发工程师',
    desc: '公司级基础研发平台建设，统一日志、监控、配置中心。推动团队工程效能提升，规范 CI/CD 流程。',
    tech: ['Java', 'Spring Cloud', 'Kafka', 'Docker'],
  },
]

const advantages = [
  {
    icon: '🏆',
    title: '全周期最高绩效',
    desc: '在东华医为、数字马力、泛联新安三家公司的所有绩效周期内，均获得 A / A++ 最高评级，是业务部门核心开发人员',
  },
  {
    icon: '🎯',
    title: 'BU AI 专项负责人',
    desc: '担任 BU AI 专项负责人，主导 AI 辅助编程工具引入与使用规范制定，推动代码生成、自动化测试用例编写等场景落地',
  },
  {
    icon: '📈',
    title: '效率提升',
    desc: '团队研发效率显著提升，主导内部技术分享 20+ 场，建立代码 Review 机制、CI/CD 规范及技术债务治理方案',
  },
]

export default function Home() {
  return (
    <>
      <BackgroundFX />
      {/* HERO */}
      <section
        className="relative min-h-screen flex items-center justify-center px-6"
        id="main"
        style={{ position: 'relative', zIndex: 10 }}
      >
        <div className="text-center max-w-5xl">
          <div className="inline-block px-4 py-1 rounded-full border border-neon-blue/50 text-neon-blue text-sm mb-6 backdrop-blur-sm bg-neon-blue/5">
            🤖 AI Agent 工程师 | 全栈开发者
          </div>
          <h1 className="hero-title-cn mb-6">刘 酝 泽</h1>
          <p className="text-text-secondary text-lg md:text-xl mb-8">
            Jensen · AI Agent 架构师 · 5 年深耕企业级 AI 应用
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {heroTags.map((tag) => (
              <span key={tag} className="hero-tag">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 justify-center mb-4">
            <div className="contact-item">
              <span>📍</span>
              <span>长沙</span>
            </div>
            <div className="contact-item">
              <span>📱</span>
              <span>13384459987</span>
            </div>
            <div className="contact-item">
              <span>📧</span>
              <span>jensenlyz@163.com</span>
            </div>
          </div>

          <div className="flex gap-4 justify-center flex-wrap mt-6">
            <Link
              to="/blog"
              className="px-6 py-2 rounded border border-neon-blue neon-text-blue hover:bg-neon-blue/10 transition"
            >
              📚 阅读博客
            </Link>
            <a
              href="mailto:jensenlyz@163.com"
              className="px-6 py-2 rounded border border-neon-pink neon-text-pink hover:bg-neon-pink/10 transition"
            >
              ✉️ 联系我
            </a>
          </div>

          <div className="terminal-intro">
            <div className="terminal-line">$ whoami</div>
            <div
              className="terminal-line"
              style={{ color: 'var(--neon-blue, #00f5ff)' }}
            >
              $ 我是一名 AI Agent 工程师，专注于企业级智能体研发平台建设
            </div>
            <div
              className="terminal-line"
              style={{ color: 'var(--neon-purple, #b829dd)' }}
            >
              $ 精通 RAG、MCP、A2A 等智能体核心协议
            </div>
            <div
              className="terminal-line"
              style={{ color: 'var(--neon-green, #39ff14)' }}
            >
              $ 推动团队研发效率提升
              <span className="cursor"></span>
            </div>
          </div>
        </div>

        <div className="scroll-indicator">
          <div className="scroll-arrow" />
          <span>向下滚动</span>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12 reveal">
          <span className="section-tag">// ABOUT ME</span>
          <h2 className="section-title">关于我</h2>
          <p className="section-desc">
            全周期最高绩效 · BU AI 专项负责人 · 技术深度与广度兼备
          </p>
        </div>
        <div className="about-grid">
          <div className="about-image reveal">
            <div className="about-ring" />
            <div className="about-ring" />
            <div className="about-avatar">JZ</div>
          </div>
          <div className="about-text reveal">
            <p>
              你好，我是<strong>刘酝泽（Jensen）</strong>，一名 AI Agent
              工程师与全栈开发者，目前专注于企业级智能体研发平台建设。
            </p>
            <p>
              拥有
              <strong>5 年</strong>
              后端开发与 AI 工程经验，从单体应用到微服务架构、从传统 Java
              企业级开发到 LLM 驱动的智能体系统建设。主导设计了企业内部
              MCP 工具调用体系、Serverless 智能管控平台、AI
              辅助医疗信息系统等多个项目。
            </p>
            <p>
              持续关注前沿 AI 技术，包括 Agent 设计模式（ReAct、Plan-Execute、Multi-Agent
              Debate）、MCP/A2A 协议、LLM 微调与推理优化。热衷于将技术能力转化为实际业务价值，推动团队研发效率提升
              <strong>300%</strong>。
            </p>
          </div>
        </div>
      </section>

      {/* SKILLS */}
      <section id="skills" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16 reveal">
          <span className="section-tag">// TECH STACK</span>
          <h2 className="section-title">技术栈</h2>
          <p className="section-desc">从 AI Agent 到企业级工程化，端到端能力</p>
        </div>
        {skillCategories.map((cat) => (
          <div key={cat.name} className="skill-category reveal">
            <div className="skill-category-header">
              <div className="skill-category-icon">{cat.icon}</div>
              <h3 className="skill-category-title">{cat.name}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cat.items.map((item) => (
                <div key={item.title} className="skill-card-3d">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((t) => (
                      <span key={t} className="skill-tag-small">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* PROJECTS */}
      <section id="projects" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16 reveal">
          <span className="section-tag">// PROJECTS</span>
          <h2 className="section-title">代表项目</h2>
          <p className="section-desc">
            从医疗 AI 到企业 Agent 平台，多个 0→1 落地经验
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((p) => (
            <div key={p.title} className="project-card reveal">
              <div className="project-header">
                <div className="project-icon">{p.icon}</div>
                <span className="project-period">{p.period}</span>
              </div>
              <h3 className="project-title">{p.title}</h3>
              <p className="project-role">{p.role}</p>
              <p className="project-desc">{p.desc}</p>
              <div className="project-tech">
                {p.tech.map((t) => (
                  <span key={t} className="tech-tag">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ADVANTAGES */}
      <section id="advantages" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16 reveal">
          <span className="section-tag">// WHY ME</span>
          <h2 className="section-title">核心优势</h2>
          <p className="section-desc">技术 + 业务 + 团队，三位一体的综合能力</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {advantages.map((a) => (
            <div key={a.title} className="advantage-card reveal">
              <div className="advantage-icon">{a.icon}</div>
              <h3 className="advantage-title">{a.title}</h3>
              <p className="advantage-desc">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 px-6 max-w-4xl mx-auto text-center">
        <div className="reveal">
          <span className="section-tag">// CONTACT</span>
          <h2 className="section-title">联系我</h2>
          <p className="section-desc mb-8">
            欢迎交流 AI Agent 架构、企业级 LLM 应用、全栈技术
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="mailto:jensenlyz@163.com"
              className="px-6 py-2 rounded border border-neon-blue/50 hover:bg-neon-blue/10 neon-text-blue"
            >
              📧 jensenlyz@163.com
            </a>
            <a
              href="https://github.com/lyzsniper"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 rounded border border-neon-purple/50 hover:bg-neon-purple/10 neon-text-purple"
            >
              🐙 GitHub
            </a>
            <Link
              to="/blog"
              className="px-6 py-2 rounded border border-neon-pink/50 hover:bg-neon-pink/10 neon-text-pink"
            >
              📚 阅读博客
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
