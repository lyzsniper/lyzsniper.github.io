# LLM-Wiki 集成方案

> **目标**：把现有博客平台升级为 LLM-maintained 知识库
> **基于**：Andrej Karpathy 2026 年提出的 LLM Wiki 模式
> **作者**：Atlas · 2026-06-03

---

## 一、什么是 LLM-Wiki（研究综述）

### 1.1 起源与核心思想

**Karpathy 的核心洞察**（2026 年 4 月发布的 pattern 文档）：

> 与其在每次查询时从原始文档里"重新检索"（传统 RAG），不如让 LLM **预先编译** 一份结构化、可交叉引用的 markdown wiki。每新增一份资料，LLM 都去更新现有 wiki 页面、添加 `[[wikilinks]]` 交叉引用、标记矛盾。知识**累积**而非每次重新生成。

```
传统 RAG:    query → 搜 chunks → 生成答案 → 忘了
LLM Wiki:    sources → LLM 编译 → 持久 wiki → 每次查询都站在巨人肩膀上
```

### 1.2 业界实现调研

| 项目 | 技术栈 | 亮点 | 适用 |
|---|---|---|---|
| **nashsu/llm_wiki** | Tauri (Rust) + React 19 + TS | 三栏布局、向量检索 + 图扩展、MCP server、Deep Research | 桌面端、跨平台 |
| **ddsyasas/llm-wiki** | Next.js 14 + TS + SQLite/FTS5 | OpenRouter + Ollama 双后端、NPM 一键安装 | 通用 Web 端 |
| **geronimo-iia/llm-wiki** | Rust 单二进制 + tantivy | Git-backed、纯引擎、零 LLM 依赖 | CLI + MCP/ACP |
| **nvk/llm-wiki** | Claude Code plugin + AGENTS.md | 5/8/10 并行研究代理 | 编码代理工作流 |
| **atomicstrata/llmwiki** | Python + litellm | 两阶段编译、增量、混合检索、CI 可校验 | 工程化最完整 |
| **synth-wiki** | Python | 中文分词 Jieba、跨源综合 | 中文场景 |
| **llmwikify** | Python + SQLite FTS5 | 双向引用、查询漏斗、28 MCP 工具 | 进阶 |
| **markedup** | Go | YAML frontmatter 即图、Obsidian 兼容 | 极简 |
| **kgmd** | Python + NetworkX | 知识图谱构建 | 研究 |

**共同设计模式**（提炼）：

1. **三层架构**：`raw/`（不可变源） → `wiki/`（LLM 维护） → `schema/`（约定）
2. **YAML frontmatter** + **`[[wikilinks]]`** + **Obsidian 兼容**
3. **三类操作**：**Ingest**（摄入） + **Query**（查询） + **Lint**（体检）
4. **信任/矛盾检测**：每页都有 `sources: []` 回溯
5. **MCP/Agent 集成**：标准接口让 AI 代理直接 query
6. **混合检索**：BM25 + 向量 + 图扩展
7. **查询归档**：好答案存为新 wiki 页（compounding）

---

## 二、与现有博客的融合策略

### 2.1 现状资产

```
✅ 已有：
- content/published/YYYY/MM/<slug>/index.md  ← 已具备 wiki 页结构
- frontmatter（title/slug/date/tags/summary/status）
- chokidar inbox 监听自动 ingest
- gray-matter + marked + highlight.js 渲染
- tags 系统 + FlexSearch 全文搜索
- editor 双栏预览
- 外部 agent 接入口子（POST /api/agent/publish）
- RSS / 下载 / 批量打包
- 自定义标签（color/description）
- 文章分类（层级 category）
```

### 2.2 核心改造思路

> **博客即 wiki，wiki 即博客**。不需要新建一个孤立的 llm-wiki 系统，**把现有平台升级为 LLM-wiki 的 web 前端 + 后端**。

```
┌──────────────────────────────────────────────────────────────┐
│ 现有博客平台 (React + Fastify + SQLite)                        │
│                          ↓ 升级                              │
│ LLM-Wiki 平台：博客作为 wiki 的"人写层"                         │
└──────────────────────────────────────────────────────────────┘
```

| 角色 | 传统博客 | LLM-wiki 升级后 |
|---|---|---|
| `raw/` | ❌ 没有 | ✅ `content/inbox/` + `content/raw/`（用户/agent 投放原始资料） |
| `wiki/` | ✅ `content/published/`（手写为主）| ✅ **同** — 但 LLM 也能写入 |
| `schema/` | ❌ 没有 | ✅ `content/wiki/SCHEMA.md`（约定如何写/收） |
| `ingest` | ✅ chokidar inbox | ✅ **增强** — 加 LLM 提炼步骤 |
| `query` | ✅ FlexSearch 全文 | ✅ **增强** - + 跨页关联、LLM 合成 |
| `lint` | ❌ 没有 | ✅ 体检（断链、孤立、矛盾） |

### 2.3 关键设计决策

| 决策 | 选项 | 选 | 理由 |
|---|---|---|---|
| Wiki 页存储 | 纯 markdown / 纯 DB / 文件+DB | **文件+DB**（现状）| 已有，可 Obsidian 打开 |
| `[[wikilinks]]` 语法 | 自定义 / Obsidian 风格 | **Obsidian 风格** | 业界标准，Obsidian/VSCode 通用 |
| 跨页链接渲染 | 服务端预解析 / 客户端解析 | **客户端解析** | React 组件直接处理 |
| 实体抽取 | LLM 抽取 / 手动 | **混合** — LLM 自动 + 手动覆写 | 灵活性 |
| 向量检索 | LanceDB / Chroma / pgvector / FlexSearch | **FlexSearch 升级 + 可选 LanceDB** | 已用 FlexSearch，量小时够用 |
| 矛盾检测 | LLM 调用 / 文本 diff | **Phase 2 再做**，MVP 跳过 | MVP 聚焦基础能力 |
| MCP server | stdio / HTTP | **HTTP 19828** (借鉴 nashsu) | 远程 agent 友好 |

---

## 三、架构图（升级后）

```
                          ┌──────────────────────────┐
                          │  用户 / Hermes Agent      │
                          └────────────┬─────────────┘
                                       │ curl POST /api/agent/publish
                                       │ 或 cat > content/raw/*.md
                                       ▼
┌──────────────────────────────────────────────────────────────┐
│  Fastify API (Node 24)                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐          │
│  │  Ingest     │  │  Query      │  │  Lint        │          │
│  │  Pipeline   │  │  Engine     │  │  Engine      │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘          │
│         │               │               │                  │
│  ┌──────▼───────────────▼───────────────▼───────┐          │
│  │  FlexSearch Index  │  SQLite Metadata  │  LLM   │          │
│  │  (全文 + 实体)     │  (posts/tags/     │  Bridge │          │
│  │                    │   entities/...)   │         │          │
│  └──────┬───────────────┬───────────────────┘         │
└─────────┼───────────────┼──────────────────────────────┘
          │               │
   ┌──────▼──────┐  ┌─────▼──────┐
   │ content/    │  │  data/     │
   │ ├─ raw/     │  │  blog.db   │
   │ ├─ inbox/   │  └────────────┘
   │ └─ wiki/
   │    └─ published/
   └─────────────┘
```

---

## 四、功能规划（4 个 Phase）

### Phase 1: 基础强化（**当前已完成 ✅**）

- [x] 标签自定义（color, description）
- [x] 分类（层级 category）
- [x] chokidar inbox 监听
- [x] agent 接入口子 `POST /api/agent/publish`
- [x] FlexSearch 全文搜索
- [x] RSS / 下载 / 批量打包

### Phase 2: Wiki 核心（**下一步**）

**目标**：让现有文章具备"实体页"和"概念页"双层结构

| 任务 | 描述 | 估时 |
|---|---|---|
| **2.1** 加 `entities` 表（人/公司/项目/工具/书/概念 等） | 从 frontmatter `entities: [name1, name2]` 提取 | 2h |
| **2.2** 加 `entity_mentions` 表（实体×文章多对多） | 文章引用某实体时建立 | 1h |
| **2.3** Wiki-link 解析器 | 把正文里的 `[[slug]]` 转成 `<Link>` | 2h |
| **2.4** `wiki-schema.md` 约定 | 写 schema 文档，告诉 LLM 怎么维护 | 1h |
| **2.5** 实体页生成 | `/wiki/:entity-slug` 路由 + 列出引用该实体的所有文章 | 3h |
| **2.6** 跨页面包屑导航 | 实体 → 文章 / 文章 → 实体 | 1h |
| **2.7** Lint Engine v0 | 简单规则：死链、孤立页、空 frontmatter | 2h |

### Phase 3: LLM 提炼管线（**中后期**）

**目标**：丢进 `content/raw/` 一份 PDF/Markdown，LLM 自动提炼成 wiki 页

| 任务 | 描述 | 估时 |
|---|---|---|
| **3.1** LLM Provider 抽象层 | 统一 OpenAI / Anthropic / Ollama 接口 | 4h |
| **3.2** 文档解析（PDF/DOCX/PPTX/HTML） | mammoth, pdf-parse 等 | 4h |
| **3.3** 两阶段 ingest | Step 1: LLM 抽取 entities+concepts，Step 2: 生成 wiki 页 | 8h |
| **3.4** 矛盾检测 | 新内容 vs 旧页 — 调用 LLM 比对 | 4h |
| **3.5** 来源追溯 | 每页自动加 `sources: [...]` | 1h |
| **3.6** `index.md` 维护 | LLM 每次 ingest 后自动更新导航索引 | 2h |
| **3.7** `log.md` 维护 | append-only 操作日志 | 1h |

### Phase 4: Agent & 查询（**远期**）

| 任务 | 描述 | 估时 |
|---|---|---|
| **4.1** MCP server (HTTP 19828) | 12+ 工具（query/search/list/read/lint/sync/export） | 6h |
| **4.2** Query 合成 | RAG 选页 → LLM 合成答案 + `[[wikilinks]]` 引用 | 4h |
| **4.3** Query 归档 | 好答案存为新 wiki 页（query compounding） | 3h |
| **4.4** 知识图谱 | D3/vis.js 可视化 entity-关系图 | 6h |
| **4.5** Ollama 支持 | 本地模型 fallback，隐私模式 | 4h |
| **4.6** Deep Research | Tavily/SerpApi 自动找资料、auto-ingest | 6h |
| **4.7** 跨 wiki 查询 | 多个 wiki 实例间查关联 | 4h |

---

## 五、关键数据模型

```sql
-- Phase 2 新增表
CREATE TABLE entities (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT UNIQUE NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  type        TEXT,                       -- 'person' | 'company' | 'project' | 'tool' | 'book' | 'concept'
  description TEXT,
  aliases     TEXT,                       -- JSON array
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE entity_mentions (
  post_id   INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  entity_id INTEGER NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  context   TEXT,                         -- 上下文句子
  PRIMARY KEY (post_id, entity_id)
);

CREATE TABLE wiki_links (
  from_post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  to_slug      TEXT NOT NULL,            -- 目标 slug（可能是 entity 或 post）
  to_type      TEXT,                     -- 'post' | 'entity'
  PRIMARY KEY (from_post_id, to_slug, to_type)
);

CREATE TABLE query_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  query      TEXT NOT NULL,
  answer     TEXT,
  sources    TEXT,                       -- JSON array of post slugs
  archived   BOOLEAN DEFAULT 0,          -- 是否归档为 wiki 页
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lint_issues (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  type       TEXT NOT NULL,              -- 'orphan' | 'broken_link' | 'no_summary' | 'no_tags' | ...
  severity   TEXT,                       -- 'warning' | 'error'
  target     TEXT NOT NULL,              -- 目标 slug
  message    TEXT,
  resolved   BOOLEAN DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mentions_entity ON entity_mentions(entity_id);
CREATE INDEX idx_links_to ON wiki_links(to_slug);
CREATE INDEX idx_lint_target ON lint_issues(target) WHERE resolved = 0;
```

---

## 六、Frontmatter 扩展（向后兼容）

```markdown
---
# 已有字段
title: 文章标题
slug: my-post
date: 2026-06-04
category: 技术/AI/Agent
tags: [MCP, RAG, LLM]
summary: 一句话简介
status: published

# Phase 2 新增
entities: [Model Context Protocol, Retrieval-Augmented Generation, Anthropic]
related: [mcp-protocol-spec, rag-fundamentals]   # 相关文章 slug
sources: [https://example.com/paper.pdf]        # Phase 3
confidence: 0.85                                 # 0-1，LLM 给

# 可选：AI 生成的元数据（Phase 3 写入）
ai_summary: |
  自动生成的更长摘要，用于知识图谱和搜索
keywords: [agent, orchestration, tool-use]
---

# 正文

支持 `[[wikilinks]]` 双向引用：
- 同主题：[[mcp-protocol-spec]]
- 相关概念：[[Retrieval-Augmented Generation]]
- 引用本实体的所有文章会在 [[MCP]] 页聚合

# 代码示例
\`\`\`typescript
const agent = new Agent({ llm: 'claude-opus-4', tools: [...] })
\`\`\`
```

---

## 七、API 新增

| Method | Path | 用途 |
|---|---|---|
| `GET` | `/api/entities` | 列出所有实体（带计数）|
| `GET` | `/api/entities/:slug` | 实体详情（+ 引用此实体的所有文章）|
| `GET` | `/api/posts/:slug/related` | 相关文章（基于 entity 交集）|
| `GET` | `/api/lint` | 体检所有文章 |
| `POST` | `/api/lint/fix` | 一键修复（如补 summary）|
| `POST` | `/api/query` | LLM 合成答案（需要 LLM Provider 配置）|
| `POST` | `/api/query/archive` | 把 query 答案归档为 wiki 页 |
| `GET` | `/api/mcp/tools` | MCP server 工具列表（Phase 4）|

---

## 八、LLM Provider 抽象（Phase 3 关键）

```typescript
// apps/api/src/services/llm.ts
export interface LLMProvider {
  chat(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]): Promise<string>
  embed(text: string): Promise<number[]>
}

export class OpenAIProvider implements LLMProvider { ... }
export class AnthropicProvider implements LLMProvider { ... }
export class OllamaProvider implements LLMProvider { ... }  // 本地

// 配置走环境变量
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```

**不绑定单一供应商**，按 karpathy 的 AGENTS.md 风格，把 schema 写成"vendor-agnostic"。

---

## 九、MVP 范围（建议立刻做）

**最小可用** = Phase 1（已完成）+ Phase 2 全部

**为什么 Phase 2 优先级最高**：
- 不依赖 LLM，纯结构升级
- 没有 LLM 成本，零额外服务器负载
- 用户马上能感受到：实体聚合页、`[[wikilinks]]` 双向引用
- 为 Phase 3 铺好数据结构

**Phase 3+4 视用户活跃度决定**：
- 如果用户持续写博客 → Phase 3 让 agent 帮他加速
- 如果用户想要 query 合成 → Phase 4 加 LLM provider

---

## 十、与 Karpathy 原始 pattern 的差异

| 维度 | Karpathy 原始 | 本项目 |
|---|---|---|
| 内容来源 | 任意（书、论文、聊天记录） | **博客 markdown**（人写为主，agent 推为辅）|
| 目标用户 | 通用知识工作者 | **个人技术博客** + 后续可扩展 |
| Wiki 页作者 | 100% LLM | **人写为主，LLM 辅助**（摘录、聚合、关联）|
| 部署 | Claude Code CLI + Obsidian | **Web SPA** + 任何编辑器 |
| 核心操作 | Ingest/Query/Lint | 同 + 浏览、下载、订阅 |
| 数据库 | 纯 markdown 文件 + 少量 SQLite | **文件 + 丰富 SQLite**（用户画像、统计）|

**不变的核心**：
- 三层架构
- `[[wikilinks]]` + YAML frontmatter
- Obsidian 兼容
- LLM 维护 / 人监督的分工

---

## 十一、风险与缓解

| 风险 | 缓解 |
|---|---|
| LLM 成本 | 默认关闭 LLM 提炼；只在用户触发时调用 |
| 实体抽取质量 | Phase 3 让人工可覆写；置信度评分 |
| 数据膨胀 | 增量编译 + SHA-256 缓存（借鉴 atomicstrata/llmwiki） |
| MCP server 暴露 | 127.0.0.1 绑定 + token 鉴权（借鉴 nashsu/llm_wiki）|
| 隐私 | Ollama 本地模型 fallback |

---

## 十二、时间线

| 阶段 | 估时 | 累计 |
|---|---|---|
| ✅ Phase 1（已完成）| — | — |
| Phase 2（基础 wiki 能力）| ~12h | 12h |
| Phase 3（LLM 提炼）| ~24h | 36h |
| Phase 4（Agent + 查询）| ~32h | 68h |

**MVP 完整版预计 1-2 周**（按每天 4-6 小时投入）。

---

## 十三、下一步建议

我建议**立刻开始 Phase 2**：

1. 创建 `entities` 和 `entity_mentions` 表
2. 写 wiki-link 解析器（`[[slug]]` 语法）
3. 添加实体聚合页 `/wiki/:entity-slug`
4. 写 `content/wiki/SCHEMA.md` 教 LLM 怎么维护

这些改动**零 LLM 成本**，**纯结构升级**，**所有现有功能不破坏**。

完成后再讨论 Phase 3 何时启动（需要你的 LLM Provider 选择 — OpenAI / Claude / Ollama）。

---

## 附录 A：参考链接

- [Karpathy 原始 pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
- [nashsu/llm_wiki (Tauri)](https://github.com/nashsu/llm_wiki)
- [ddsyasas/llm-wiki (Next.js)](https://github.com/ddsyasas/llm-wiki)
- [nvk/llm-wiki (Claude Code plugin)](https://github.com/nvk/llm-wiki)
- [atomicstrata/llmwiki](https://github.com/atomicstrata/llm-wiki-compiler)
- [synth-wiki (中文支持)](https://github.com/shibing624/synth-wiki)
- [kgmd (knowledge graph)](https://github.com/johncarpenter/kgmd)

## 附录 B：本项目相关文件

- `apps/api/src/services/ingest.ts` — 当前 ingest 流程
- `apps/api/src/db/posts.repo.ts` — 文章仓储
- `apps/api/src/db/tags.repo.ts` — 标签仓储（已扩展 color/description）
- `apps/api/src/lib/markdown.ts` — frontmatter + 渲染
- `apps/web/src/components/PostCard.tsx` — 列表卡片（已显示 category）
- `apps/web/src/pages/Blog.tsx` — 列表页（已支持分类筛选）
- `apps/web/src/pages/Editor.tsx` — 编辑器（已支持 category）
- `apps/web/src/pages/TagManage.tsx` — **新增** 标签管理后台
- `content/published/2023/09/*/index.md` — 历史博客（含 category 字段）
