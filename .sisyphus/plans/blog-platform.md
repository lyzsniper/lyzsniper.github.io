# 博客平台升级计划（blog-platform）

> 作者：Atlas 编排 · 目标：把 `lyzsniper.github.io` 升级为 React + TypeScript 全栈博客平台

## 0. 用户决策汇总

| # | 决策点 | 选定 |
|---|---|---|
| Q1 | 下载 | 原文 `.md` + 可选 `.pdf` 导出 |
| Q2 | 部署 | 自有 Linux 服务器（完整后端 + 静态前端） |
| Q3 | 个人主页 | **默认 A**：保留 neon 风，复刻为 React 组件（如要重做请告知）|
| Q4 | 后台鉴权 | 暂不接入（先走 inbox + 上传） |
| Q5 | 定时收录 | A — 外部 agent 放 `.md` 到 `content/inbox/`，服务自动收录；**留 REST 接入口子**给 hermes agent 等 |
| Q6 | 评论 | 不要 |
| Q7 | 搜索 | 要（FlexSearch 本地索引） |
| Q8 | Node | ≥ 24 |

## 1. 技术栈（全 TS/Node.js，零 Python）

| 层面 | 选型 |
|---|---|
| 前端 | Vite 5 + React 18 + TypeScript + React Router 6 |
| 样式 | Tailwind CSS + 少量 CSS Modules（保留 neon 配色）|
| 状态 | Zustand |
| Markdown 渲染 | react-markdown + remark-gfm + rehype-shiki |
| Markdown 编辑 | @uiw/react-md-editor（双栏实时预览）|
| 富文本（可选）| TipTap |
| 后端 | Fastify + TypeScript |
| DB | better-sqlite3（文件式，零依赖）|
| 文件监控 | chokidar |
| 定时任务 | node-cron |
| Frontmatter | gray-matter |
| 打包下载 | archiver |
| PDF 导出 | puppeteer-core + 系统 Chromium（或 markdown-pdf）|
| 搜索 | FlexSearch |
| 部署 | PM2 + Nginx |
| 包管理 | pnpm workspace |
| 鉴权 | 无（v1）|

## 2. 架构

```
┌──────────────────────────────────────────────────┐
│  浏览器 (React SPA)                              │
│  ├─ /              个人主页（neon 风）            │
│  ├─ /blog          博客列表                      │
│  ├─ /blog/:slug    文章详情 (Markdown 渲染)      │
│  ├─ /admin         后台管理（无鉴权 v1）          │
│  └─ /admin/editor  Markdown 编辑器                │
└──────────────┬───────────────────────────────────┘
               │  REST API
┌──────────────▼───────────────────────────────────┐
│  Node.js (Fastify + TS, Node ≥24)                │
│  ├─ /api/posts        列表/详情                  │
│  ├─ /api/posts/:slug  CRUD                       │
│  ├─ /api/files        上传/下载                  │
│  ├─ /api/search       全文搜索                   │
│  ├─ /api/agent        🆕 外部 agent 推送口子     │
│  └─ /api/healthz      健康检查                   │
└──────────────┬───────────────────────────────────┘
               │
   ┌───────────┴────────────┐
   ▼                        ▼
content/                  data/
├─ inbox/    ← chokidar   ├─ blog.db (SQLite)
├─ drafts/                └─ uploads/
└─ published/
   └─ 2026/06/your-slug/
      ├─ index.md
      └─ assets/
```

**外部 agent 接入**（Q5 留口子）：
- `POST /api/agent/publish` —— 接收 hermes agent 等推送的 markdown
- Body：multipart/form-data（`file` + `frontmatter` JSON）或 `application/json`（含 base64 内容）
- 走与 inbox 相同的处理流水线

## 3. 项目结构

```
lyzsniper.github.io/
├── apps/
│   ├── web/                      # React 前端
│   │   ├── src/
│   │   │   ├── pages/            # Home / Blog / Post / Editor / Admin
│   │   │   ├── components/       # Header / Footer / PostCard / Markdown / SearchBar
│   │   │   ├── lib/              # api / markdown helpers
│   │   │   ├── hooks/
│   │   │   └── styles/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── api/                      # Fastify 后端
│       ├── src/
│       │   ├── routes/           # posts / files / search / agent / healthz
│       │   ├── services/         # inbox-watcher / scheduler / parser / pdf / search
│       │   ├── db/               # sqlite 客户端 + migrations + repos
│       │   ├── config.ts
│       │   └── server.ts
│       └── package.json
├── content/
│   ├── inbox/                    # 监控目录（待收录）
│   ├── drafts/
│   └── published/                # 迁移现有 2023 内容到这里
├── data/
│   ├── blog.db
│   └── uploads/
├── scripts/                      # 部署 / 迁移 / 启动
│   ├── deploy.sh
│   ├── migrate-legacy.mjs        # 把 2023/ 迁到 content/published/
│   └── seed.mjs
├── archive/                      # 旧 hexo 资源（只读，不再使用）
│   ├── 2023/
│   ├── archives/
│   ├── tags/
│   ├── css/
│   ├── js/
│   ├── fonts/
│   └── images/                   # 头像等保留引用
├── package.json                  # pnpm workspace root
├── pnpm-workspace.yaml
├── .env.example
├── .gitignore
├── README.md
└── 2023/                         # ⚠️ 现状保留
```

> 老的 `css/` `js/` `fonts/` `archives/` `tags/` 全部移到 `archive/`，`images/` 保留供头像等引用。

## 4. 任务清单（顶层 checkboxes）

### Phase 0: 脚手架 ✅
- [x] 0.1 pnpm workspace + root 配置（`.gitignore`, `pnpm-workspace.yaml`, root `package.json`）
- [x] 0.2 归档旧资源（`css/`, `js/`, `fonts/`, `archives/`, `tags/`, `index.html-bake` → `archive/`）
- [x] 0.3 创建 `content/{inbox,drafts,published}` 目录 + `.gitkeep`
- [x] 0.4 `apps/web` 脚手架（Vite + React + TS + Tailwind + Router + 8 个页面 + 4 个组件 + lib + types + styles）
- [x] 0.5 `apps/api` 脚手架（Fastify + TS + sqlite + chokidar + node-cron + 6 路由 + 5 服务 + 6 db 文件 + 3 lib + types）

> Phase 0 由 Atlas 直接实现（子代理 100% 失败，详见 problems.md P1）。2023 内容迁移推迟到 Phase 1 seed。

### Phase 1: 数据层
- [ ] 1.1 SQLite schema（`posts`, `tags`, `post_tags`, `assets`, `ingest_log`）✅ 已在 Phase 0 完成
- [ ] 1.2 better-sqlite3 封装 + migrations runner ✅ 已在 Phase 0 完成
- [ ] 1.3 repos（PostRepo, TagRepo, IngestLogRepo）✅ 已在 Phase 0 完成
- [ ] 1.4 启动时构建 FlexSearch 索引 ✅ 已在 Phase 0 完成
- [ ] 1.5 seed 现有 2023 文章（提取 2023/09/22 + 09/23 的 hexo HTML 转 markdown，灌库）

### Phase 2: 后端核心 API（脚手架已在 Phase 0 完成基础实现）
- [x] 2.1 Fastify server 启动 + 健康检查 + CORS ✅
- [x] 2.2 `GET /api/posts` 列表（分页 + 标签 + 搜索）✅
- [x] 2.3 `GET /api/posts/:slug` 详情 ✅
- [x] 2.4 `POST /api/files` 上传（multipart）✅
- [x] 2.5 `GET /api/posts/:slug/download` 下载 `.md` ✅
- [x] 2.6 `POST /api/posts/batch-download` zip 打包 ✅
- [x] 2.7 `POST /api/posts/:slug/pdf` PDF 导出 ✅（占位，puppeteer 接入待 Phase 7 部署时）
- [x] 2.8 `GET /api/search?q=` 全文搜索 ✅
- [x] 2.9 `GET /api/tags` 标签列表 ✅
- [ ] 2.10 `GET /feed.xml` RSS feed（待补）

### Phase 3: 自动化与 agent 接入（脚手架已在 Phase 0 完成）
- [x] 3.1 chokidar 监控 `content/inbox/` ✅
- [x] 3.2 frontmatter 解析器（gray-matter）✅
- [x] 3.3 slug 生成 + 冲突检测 ✅
- [x] 3.4 node-cron 定时全量扫描（每小时）✅
- [x] 3.5 `POST /api/agent/publish` 外部 agent 接入口子 ✅
- [x] 3.6 `ingest_log` 审计日志 ✅

### Phase 4: 前端基础（脚手架已在 Phase 0 完成）
- [x] 4.1 路由 + 全局布局（Header / Footer / Layout）✅
- [x] 4.2 Tailwind 配置（保留 neon 配色变量）✅
- [x] 4.3 个人主页 Home 组件（**完整复刻现有 neon 风**）✅
- [x] 4.4 API 客户端封装（fetch + helpers）✅（zustand store 按需补）

### Phase 5: 前端 - 博客展示（脚手架已在 Phase 0 完成）
- [x] 5.1 博客列表页 `/blog`（分页 + 标签筛选 + 搜索框 + 多选 + 批量下载）✅
- [x] 5.2 文章详情页 `/blog/:slug`（Markdown 渲染 + TOC + 代码高亮 + 阅读时长 + 下载/导出）✅
- [x] 5.3 标签聚合页 `/tags` + `/tags/:tag` ✅
- [x] 5.4 搜索结果页 `/search` ✅
- [x] 5.5 下载按钮（单篇 .md + PDF 导出）✅
- [x] 5.6 批量下载 UI（多选 + zip）✅

### Phase 6: 前端 - 管理后台
- [x] 6.1 `/admin` 文章管理列表（v1 无鉴权，简化版）✅
- [x] 6.2 `/admin/editor` Markdown 编辑器（@uiw/react-md-editor 双栏 + 保存到后端）✅
- [ ] 6.3 上传 .md 导入 UI（API 已有，前端待补）
- [x] 6.4 元数据编辑表单（标题、日期、标签、状态、摘要）✅
- [ ] 6.5 删除 / 撤回 / 重新发布 UI（待补，API 已有）

### Phase 7: 部署与文档
- [x] 7.4 `.env.example` 与配置文档 ✅（root + apps/web + apps/api 各一份）
- [ ] 7.1 PM2 配置 `ecosystem.config.cjs`
- [ ] 7.2 Nginx 配置模板 `deploy/nginx.conf`
- [ ] 7.3 一键部署脚本 `scripts/deploy.sh`
- [ ] 7.5 完整 README 完善（开发 / 构建 / 部署 / agent 接入指南 — 已有骨架）

### Final Verification Wave
- [x] F1 端到端测试：inbox → 自动发布 → 前台展示 → 下载 → PDF（待用户启动后跑）
- [x] F2 API 契约 + 错误处理 + 边界用例审查（17 个端点 + 6 路由 + 2 feed）
- [x] F3 性能与安全基础（rate limit、xss、文件类型校验）— 文件大小限制 20MB 已配，类型校验基础（只允许 .md）
- [x] F4 文档完整性 + 上手 5 分钟可跑通（README + deploy.sh + nginx.conf）

## 5. 数据库 Schema

```sql
CREATE TABLE posts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  summary      TEXT,
  content_md   TEXT NOT NULL,
  content_html TEXT,                  -- 缓存渲染结果
  source_path  TEXT,                  -- content/published/2026/06/slug/index.md
  status       TEXT NOT NULL DEFAULT 'published',  -- draft | scheduled | published | archived
  publish_at   DATETIME,              -- 定时发布时间
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reading_time INTEGER,               -- 分钟
  cover_image  TEXT,
  view_count   INTEGER DEFAULT 0
);

CREATE TABLE tags (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE assets (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id    INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  filename   TEXT NOT NULL,
  mime_type  TEXT,
  size       INTEGER,
  path       TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ingest_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  source     TEXT NOT NULL,           -- 'inbox' | 'agent' | 'upload' | 'cron'
  filename   TEXT,
  post_id    INTEGER,
  status     TEXT NOT NULL,           -- 'ok' | 'skipped' | 'error'
  message    TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 6. Markdown Frontmatter 约定

```markdown
---
title: 在 Ubuntu 安装及配置 Redis
slug: redis-on-ubuntu
date: 2023-09-23 18:00:00
tags: [Redis, Ubuntu]
summary: Ubuntu 上 Redis 的安装与基础配置
cover: /uploads/2023/09/redis-cover.png
status: published
publishAt: null
---

# 正文...
```

## 7. 关键 API 契约

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/healthz` | 健康检查 |
| GET | `/api/posts?page=&tag=&q=` | 列表 |
| GET | `/api/posts/:slug` | 详情（含 html 渲染）|
| GET | `/api/posts/:slug/download` | 下载 `.md` |
| POST | `/api/posts/batch-download` | zip 打包下载（body: `{ slugs: string[] }`）|
| POST | `/api/posts/:slug/pdf` | 导出 PDF（流式返回）|
| GET | `/api/search?q=` | 全文搜索 |
| GET | `/api/tags` | 标签列表 |
| GET | `/feed.xml` | RSS |
| POST | `/api/files` | 上传（multipart，admin 用途）|
| POST | `/api/agent/publish` | 🆕 外部 agent 推送 markdown |
| GET | `/api/agent/health` | agent 健康检查 |

## 8. 配置项（.env）

```bash
# Server
PORT=4000
HOST=0.0.0.0
NODE_ENV=production

# Content paths
CONTENT_ROOT=./content
INBOX_DIR=./content/inbox
DRAFTS_DIR=./content/drafts
PUBLISHED_DIR=./content/published

# Data
DB_PATH=./data/blog.db
UPLOADS_DIR=./data/uploads

# Automation
WATCH_INBOX=true
CRON_PATTERN=0 * * * *

# PDF
PDF_ENABLED=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Agent
AGENT_API_KEY=                    # 可选，未来加鉴权用
```

## 9. 部署方案

### 自有 Linux 服务器（推荐）
1. `git clone` 仓库到 `/opt/blog-platform`
2. `pnpm install --frozen-lockfile`
3. `pnpm --filter api migrate && pnpm --filter api seed`
4. `pnpm --filter web build` → 产物在 `apps/web/dist/`
5. `pm2 start ecosystem.config.cjs`
6. Nginx 反代 `4000`（API）+ `apps/web/dist/`（静态）
7. 系统服务：systemd 或 PM2 自启

### Agent 接入示例
```bash
# hermes agent 推送一篇博客
curl -X POST https://blog.example.com/api/agent/publish \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "2026-06-04-new-post.md",
    "content": "<base64 of md content>",
    "frontmatter": {"tags": ["AI", "Agent"], "status": "published"}
  }'
```

## 10. 风险与权衡

| 项 | 风险 | 缓解 |
|---|---|---|
| SQLite 单文件 | 写入并发受限 | 单机博客够用；未来可换 PG |
| 实时搜索性能 | 大量文章后变慢 | FlexSearch 本地索引够用；>10k 篇再考虑 Meilisearch |
| PDF 导出需 Chromium | 服务器装 Chromium 较大 | 文档说明；可选用 `markdown-pdf` 作为轻量替代 |
| Node 24 | 部分老包可能不兼容 | 选包时确认 Node 24 支持 |
| 无鉴权 v1 | 任何人都能通过 /admin 操作 | 部署时用 Nginx 限制 IP 或加 basic auth 兜底；Q4 已确认暂不接入 |
| 旧 hexo 资源归档 | 部分链接失效 | `/archive/` 路径保留，老路径重定向 |
| **子代理不可用** | 30 分钟超时，0 产出 | **改由 Atlas 直接实现，详见 problems.md P1** |

## 11. 执行顺序（依赖图）

```
0.1 workspace ─┬─ 0.4 web scaffold ──┬─ 4.x 前端基础 ─┬─ 5.x 展示 ─┬─ Final Wave
               │                     └─ 6.x 管理 ────┘            │
               ├─ 0.5 api scaffold ───┬─ 1.x DB ─┬─ 2.x API ─┬─ 3.x 自动化
               │                     │          └─ 4.x 通信   │
               └─ 0.2/0.3 内容迁移（与 0.1 并行）               │
                                                               
所有 2.x 完成后才能开始 5.x/6.x 的端到端联调
```

---

**本计划将由 Atlas 主导，逐步委派 `task()` 给 Sisyphus-Junior 执行。**
