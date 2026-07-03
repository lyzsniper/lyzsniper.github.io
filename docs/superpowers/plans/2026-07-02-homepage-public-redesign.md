# 个人主页公开版改版实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `apps/web/src/pages/Home.tsx` 改版为面向同行与合作者的"留白即权威"风格主页——隐藏公司信息、脱敏医疗经历、强化 AI Agent 定位、把"核心优势"从履历标签升级为工程观点。

**Architecture:** 单文件改动。保留所有设计 token、tailwind 配置、组件、3D 图谱、BackgroundFX、Header/Footer。替换 `Home.tsx` 中的 `projects`、`advantages` 数组和 Hero/About 文案；将"卡片网格"区改为"单栏编号列表"。无新增依赖、无新增组件。

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind + lucide-react（已存在，沿用）

## Global Constraints

- **不修改** `apps/web/src/styles/globals.css`、`apps/web/tailwind.config.ts`、`apps/web/src/components/*` 下任何组件
- **不修改** `apps/web/src/data/skillGraph.ts`（3D 图谱数据保留）
- **不引入** 任何新依赖（package.json 不动）
- **不新增** 任何新组件文件
- **不出现** 任何公司名（东华医为、数字马力、泛联新安 等）、医疗场景（超声/放射/三甲医院 等）、内部术语（BU/Leader/负责人 等）、绩效评级（A/A++ 等）
- **沿用** 现有 class：`eyebrow`、`btn btn-primary/secondary`、`pill`、`surface-card`、`container-page`、`text-display-xl/lg/md/sm`、`text-body-lg/body/body-sm`、`pill-accent`
- **沿用** 现有变量：`--accent`、`--accent-soft`、`--fg-primary/secondary/tertiary`、`--border-subtle`、`--bg-page/elevated/muted`
- **每次 commit 必须** 单独一个语义化 commit（feat/fix/docs），用 `-c commit.gpgsign=false`
- **commit 末尾必须** 含 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

## File Structure

| 文件 | 改动类型 | 责任 |
|---|---|---|
| `apps/web/src/pages/Home.tsx` | 修改（唯一改动文件） | 主页全部内容（Hero / About / Skill / 能力矩阵 / 核心优势 / CTA） |
| `docs/superpowers/specs/2026-07-02-homepage-public-redesign-design.md` | 不动 | 已 commit 的 spec |
| 其它 | 不动 | 见 Global Constraints |

---

## Task 1: 重写 Hero 区

**Files:**
- Modify: `apps/web/src/pages/Home.tsx:190-231`（原 HERO 区块）

**Interfaces:**
- Consumes: 现有 `expertise` 数组（第 21-27 行，pills 行复用它，不重新定义）
- Produces: 新的 eyebrow 文案、h1 标题、p 副标；pills 与 CTA 文案沿用现有

- [ ] **Step 1: 替换 Hero 区 JSX**

把第 196-231 行的 `<section>` 整段替换为：

```tsx
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
```

- [ ] **Step 2: 验证 Hero 区没有硬编码公司/医疗字眼**

Run: `grep -n "东华\|数字马力\|泛联\|三甲\|超声\|放射" apps/web/src/pages/Home.tsx`
Expected: 无任何匹配（结果为空）

- [ ] **Step 3: 启动 dev server 检查渲染**

Run: `cd apps/web && pnpm dev`
Expected: 启动后浏览器打开 `http://localhost:5173` 能看到新 Hero（eyebrow 为 "AI Agent Engineer · Backend Architect"，h1 为新标题）。Ctrl+C 关闭。

- [ ] **Step 4: Commit**

Run:
```bash
git add apps/web/src/pages/Home.tsx
git -c commit.gpgsign=false commit -m "feat(home): 重写 Hero — 立场式标题、Demo→生产 工程张力

- eyebrow: AI Agent Engineer · Backend Architect
- h1: 我设计能在生产环境跑起来的智能体系统
- 副标: 把 Demo 变成可被运维的工程
- 删除原『5 年深耕 + 医疗/Serverless/企业研发』枚举式开场

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 改写 About 区文案

**Files:**
- Modify: `apps/web/src/pages/Home.tsx:233-263`（原 ABOUT 区块）

**Interfaces:**
- Consumes: 无
- Produces: 3 句话的 About 描述，无公司名/场景名

- [ ] **Step 1: 替换 About 区三段文字**

把第 246-261 行的 `<div className="reveal space-y-5 ...">` 内三段 `<p>` 替换为：

```tsx
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
```

- [ ] **Step 2: 验证 About 区无敏感词**

Run: `grep -n "MCP 工具调用体系\|Serverless 智能管控\|医疗信息\|5 年\|东华\|数字马力\|泛联\|三甲" apps/web/src/pages/Home.tsx`
Expected: 无任何匹配

- [ ] **Step 3: Commit**

Run:
```bash
git add apps/web/src/pages/Home.tsx
git -c commit.gpgsign=false commit -m "feat(home): 改写 About — 去除企业内项目与场景枚举

原文中『企业内部 MCP 工具调用体系、Serverless 智能管控平台、AI 辅助医疗信息系统』
透露项目场景；改为 ToB / 平台型 / 垂直行业信息化 三类抽象定位。

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 替换 `projects` 数组为 `capabilities` 数据结构

**Files:**
- Modify: `apps/web/src/pages/Home.tsx:128-170`（原 `interface Project` + `projects` 数组）
- Modify: `apps/web/src/pages/Home.tsx:1-16`（import 区域）

**Interfaces:**
- Consumes: 无
- Produces: `Capability` 接口 + `capabilities` 数组（5 项），后续 Task 4 渲染使用

- [ ] **Step 1: 添加 `Capability` 接口并替换 `projects` 数组**

把第 128-170 行（`interface Project` 起始到 `projects` 数组结束的 `]` ）替换为：

```tsx
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
```

- [ ] **Step 2: 清理 import 中不再使用的图标**

第 1-16 行的 lucide-react import 当前包含：
```tsx
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
```

确认一下：`Bot`、`Server`、`Layers`、`Wrench` 仍被 `skillCategories` 使用（第 42、70、94、112 行），必须保留。`Sparkles`、`Trophy`、`Target`、`TrendingUp` 仍被后续 Task 的渲染代码使用到本任务时点还不需要——为安全起见，**本 Task 不动 import**，留到 Task 6（最后清理）一起处理。

- [ ] **Step 3: 验证 TS 编译通过**

Run: `cd apps/web && pnpm build`
Expected: 编译错误为 `projects is not defined` 或 `Cannot find name 'projects'` 之类（因为渲染区还没改，这是预期的）。如果出现别的错误则中止修复。

注意：本步骤预期会有 TS 报错，这是正确的——渲染代码还在引用旧名 `projects`。继续 Task 4 即可消除。

- [ ] **Step 4: Commit（数据结构单独提交）**

Run:
```bash
git add apps/web/src/pages/Home.tsx
git -c commit.gpgsign=false commit -m "refactor(home): 替换 projects 数组为 capabilities（5 个能力域）

按『我解决的问题类型』组织，引入 Capability 接口。
每域结构: 编号 + 标题 + 立场 + 证据。无公司名、无医疗场景。
渲染区暂未迁移，TS 编译暂报 projects 未定义，下一 task 修复。

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: 渲染能力矩阵（替代项目卡片网格）

**Files:**
- Modify: `apps/web/src/pages/Home.tsx:336-377`（原 PROJECTS section）

**Interfaces:**
- Consumes: Task 3 新增的 `capabilities` 数组
- Produces: 单栏编号列表视觉，每域独立 `<article>`

- [ ] **Step 1: 替换 PROJECTS section 整体**

把第 335-377 行的 `{/* ===== PROJECTS — zig-zag bento ===== */}` 整段 `<section>` 替换为：

```tsx
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
```

- [ ] **Step 2: 验证 TS 编译通过**

Run: `cd apps/web && pnpm build`
Expected: 编译成功，无 TS 报错。

- [ ] **Step 3: 验证无 `projects` 残留**

Run: `grep -n "\bprojects\b" apps/web/src/pages/Home.tsx`
Expected: 无任何匹配（如果还有，会指向未清理的渲染代码）

- [ ] **Step 4: 启动 dev 浏览器视觉确认**

Run: `cd apps/web && pnpm dev`
浏览器打开 `http://localhost:5173`，滚动到"能力域"区块，确认：
- 5 个能力域按 01-05 编号、单栏、垂直间距宽松
- 每域有"立场句"+"证据列表"（05 没有证据列表）
- 无任何卡片背景色、无图标
Ctrl+C 关闭。

- [ ] **Step 5: Commit**

Run:
```bash
git add apps/web/src/pages/Home.tsx
git -c commit.gpgsign=false commit -m "feat(home): 渲染能力矩阵 — 单栏编号列表替代卡片网格

5 个能力域垂直排列，每域结构：编号 + 标题 + 立场句 + 证据 bullet。
视觉去卡片化，对齐『留白即权威』气质。

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 替换 `advantages` 数组为 `principles` 数据结构

**Files:**
- Modify: `apps/web/src/pages/Home.tsx:172-188`（原 `advantages` 数组）

**Interfaces:**
- Consumes: 无
- Produces: `Principle` 接口 + `principles` 数组（3 项），后续 Task 6 渲染使用

- [ ] **Step 1: 替换 `advantages` 数组**

把第 172-188 行（`const advantages` 整段）替换为：

```tsx
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
```

- [ ] **Step 2: 验证编译（预期报错，下一 task 修复）**

Run: `cd apps/web && pnpm build`
Expected: 报 `advantages is not defined` 或类似 TS 错误。这是预期的——渲染代码还在引用旧名。

- [ ] **Step 3: Commit**

Run:
```bash
git add apps/web/src/pages/Home.tsx
git -c commit.gpgsign=false commit -m "refactor(home): 替换 advantages 数组为 principles（3 段工程观点）

原 advantages 是履历标签（全周期最高绩效 / BU AI 专项负责人 / 效率与团队建设）。
principles 改为 pull-quote + 论证散文，每段是独立工程判断。
渲染区暂未迁移，下一 task 修复。

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: 渲染核心优势区（3 段 pull-quote + 论证）

**Files:**
- Modify: `apps/web/src/pages/Home.tsx:380-407`（原 ADVANTAGES section）
- Modify: `apps/web/src/pages/Home.tsx:1-16`（import 清理——本 Task 末尾做）

**Interfaces:**
- Consumes: Task 5 新增的 `principles` 数组
- Produces: 3 段编号大字号引文 + 论证散文视觉

- [ ] **Step 1: 替换 ADVANTAGES section 整体**

把第 379-407 行（`{/* ===== ADVANTAGES ===== */}` 整段 `<section>`）替换为：

```tsx
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
```

- [ ] **Step 2: 清理不再使用的 import**

第 1-16 行的 lucide-react import，本 Task 完成后以下图标不再被引用：`Sparkles`、`Trophy`、`Target`、`TrendingUp`。
`Bot`、`Server`、`Layers`、`Wrench` 仍被 `skillCategories` 使用。
`ArrowRight`、`Mail`、`Github` 仍被 Hero/CTA 使用。
`LucideIcon` 类型仍被 `SkillCategory` 使用。

把第 1-16 行替换为：

```tsx
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
```

- [ ] **Step 3: 验证 TS 编译通过**

Run: `cd apps/web && pnpm build`
Expected: 编译成功，无 TS 报错，无未使用 import 警告。

- [ ] **Step 4: 验证无 `advantages` 残留**

Run: `grep -n "\badvantages\b" apps/web/src/pages/Home.tsx`
Expected: 无任何匹配

- [ ] **Step 5: 启动 dev 浏览器视觉确认**

Run: `cd apps/web && pnpm dev`
浏览器打开 `http://localhost:5173`，滚动到"核心优势"区块，确认：
- 3 段工程观点，每段有 01/02/03 编号、大字号引文（带 " "）、下方论证散文
- 视觉上无卡片背景色、无图标
- 引文读起来是工程判断（"Demo→生产"、"减法架构"、"能不能做→值不值得维护"）
Ctrl+C 关闭。

- [ ] **Step 6: Commit**

Run:
```bash
git add apps/web/src/pages/Home.tsx
git -c commit.gpgsign=false commit -m "feat(home): 渲染核心优势 — 3 段工程观点 pull-quote

- 替换 advantages 卡片网格为 principles 单栏叙事
- 每段结构：大编号 + 大字号引文 + 论证散文
- 同步清理未使用的 lucide 图标 import（Sparkles/Trophy/Target/TrendingUp）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: 全文件敏感词扫描 + 最终验收

**Files:**
- 不修改任何文件（纯验收）

- [ ] **Step 1: 公司名扫描**

Run:
```bash
grep -in "东华\|数字马力\|泛联新安\|医为" apps/web/src/pages/Home.tsx
```
Expected: 无任何匹配

- [ ] **Step 2: 医疗场景扫描**

Run:
```bash
grep -in "超声\|放射\|三甲\|医院\|病历\|导诊\|医师" apps/web/src/pages/Home.tsx
```
Expected: 无任何匹配

- [ ] **Step 3: 简历腔 / 内部术语扫描**

Run:
```bash
grep -in "绩效\|BU \|BU$\|Leader\|负责人\|A++\|A/\|A级" apps/web/src/pages/Home.tsx
```
Expected: 无任何匹配

- [ ] **Step 4: Hero 标题文案验证**

Run:
```bash
grep -n "你好，我是刘酝泽" apps/web/src/pages/Home.tsx
```
Expected: 出现 1 行，且仅出现在 About 区（不在 Hero 区）

- [ ] **Step 5: 终态编译验证**

Run: `cd apps/web && pnpm build`
Expected: 编译成功，bundle 体积未异常增长（±10% 内可接受）

- [ ] **Step 6: 启动 dev 做最终视觉走查**

Run: `cd apps/web && pnpm dev`
浏览器打开 `http://localhost:5173`，按顺序确认：
1. Hero — eyebrow / h1 / 副标 / pills / CTA 全部正确
2. About — 新文案，无 "MCP 工具调用体系" / "Serverless 智能管控" / "AI 辅助医疗"
3. Skills — 4 类卡片 + 3D 图谱保持原样
4. 能力域 — 5 个能力域按编号垂直排列
5. 核心优势 — 3 段 pull-quote 风格，无卡片背景
6. 结尾 CTA — 邮件 + GitHub
7. BackgroundFX 正常
8. 暗色模式切换正常（点 Header 右上角主题切换）
Ctrl+C 关闭。

- [ ] **Step 7: 查看本次会话 commit 历史**

Run: `cd apps/web/.. && git log --oneline -10`
Expected: 看到本次会话新增的 6 个 commit（spec 1 个 + 实施 6 个），按时间顺序排列。

---

## Self-Review（计划作者自审）

**1. Spec coverage:**

| Spec 节 | 计划覆盖 |
|---|---|
| 4.1 Hero | Task 1 |
| 4.2 能力矩阵 | Task 3（数据）+ Task 4（渲染） |
| 4.3 核心优势 | Task 5（数据）+ Task 6（渲染） |
| 4.4 About 改写 | Task 2 |
| 5. 保留与删除 | Task 1/2/3/4/5/6 各自覆盖 |
| 6. 数据结构 | Task 3 + Task 5 |
| 7. 实施清单 | Task 1-7 全覆盖 |
| 8. 验收标准 | Task 7 全覆盖 |
| 9. 不做的事 | Global Constraints + 任务 Files 节 |
| 10. 风险与回滚 | 单文件改动本身可 git checkout |

无遗漏。

**2. 占位符扫描:** 无 "TBD"/"TODO"/"implement later"/"add appropriate"/"similar to"。所有代码块完整可粘贴。

**3. 类型一致性:**

- `Capability` 接口（Task 3 定义）：`no: string, title: string, stance: string, evidence: string[]` → Task 4 渲染代码 `c.no`/`c.title`/`c.stance`/`c.evidence.map` 完全匹配
- `Principle` 接口（Task 5 定义）：`no: string, quote: string, argument: string` → Task 6 渲染代码 `p.no`/`p.quote`/`p.argument` 完全匹配
- import 清理（Task 6 Step 2）：删除的 4 个图标 (`Sparkles/Trophy/Target/TrendingUp`) 在 Task 6 完成后确实无引用；保留的 6 个 (`ArrowRight/Mail/Github/Bot/Server/Layers/Wrench` + `LucideIcon` 类型) 在文件其它位置仍被使用