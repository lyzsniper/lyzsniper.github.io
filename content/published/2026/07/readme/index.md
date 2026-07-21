# lyzsniper blog platform

刘酝泽的个人技术博客平台 — React 18 + TypeScript + Fastify + SQLite 全栈实现。

## ✨ 特性

- 🎨 **neon 风格个人主页**（完整复刻）
- 📝 **博客系统**：Markdown 列表/详情 + 标签 + 全文搜索
- ✍️ **Web 编辑器**：双栏实时预览（@uiw/react-md-editor）
- 📤 **多渠道发布**：上传 .md / Web 编辑器 / 外部 agent 推送
- 🤖 **自动化**：chokidar 监控 inbox + node-cron 兜底扫描
- 📥 **下载**：单篇 `.md` + 批量 zip + PDF 导出
- 🏷️ **标签 + 搜索**（FlexSearch 本地索引）
- 📡 **RSS 2.0 + Atom Feed**
- 🚀 **零数据库依赖**：SQLite 文件式

## 🛠 技术栈

| 层面 | 选型 |
|---|---|
| 前端 | Vite 5 + React 18 + TypeScript + Tailwind + React Router 6 |
| Markdown | react-markdown + remark-gfm + rehype-highlight + rehype-slug |
| 编辑器 | @uiw/react-md-editor（双栏） |
| 后端 | Fastify 5 + TypeScript + better-sqlite3 |
| 自动化 | chokidar 4 + node-cron |
| 打包 | archiver |
| 部署 | PM2 + Nginx |

## 📁 目录结构

```
.
├── apps/
│   ├── web/                  # React + Vite 前端（端口 5173）
│   │   ├── src/
│   │   │   ├── pages/         # 路由页面
│   │   │   ├── components/    # 公共组件
│   │   │   ├── lib/api.ts     # API 客户端
│   │   │   └── styles/        # Tailwind 入口
│   │   └── package.json
│   └── api/                  # Fastify 后端（端口 4000）
│       ├── src/
│       │   ├── routes/        # API 路由
│       │   ├── services/      # 业务（ingest / watcher / scheduler / search / pdf）
│       │   ├── db/            # SQLite + repos
│       │   ├── lib/           # 工具（markdown / slug / logger）
│       │   └── types/         # TypeScript 类型
│       └── package.json
├── content/
│   ├── inbox/                # chokidar 监控的待收录目录
│   ├── drafts/               # 草稿
│   └── published/            # 已发布（YYYY/MM/slug/index.md）
├── data/                     # SQLite + 上传文件（运行时生成）
├── archive/                  # 老 hexo 资源（只读）
├── scripts/
│   └── deploy.sh             # 一键部署脚本
├── deploy/
│   └── nginx.conf            # Nginx 反代模板
├── ecosystem.config.cjs      # PM2 配置
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

## 🚀 快速开始

### 1. 安装依赖（需要 Node ≥ 20.18，推荐 24）

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
# 按需修改
```

### 3. 数据库初始化 + seed

```bash
pnpm migrate           # 建表
pnpm seed              # 把 2 篇 2023 历史博客灌进库
```

### 4. 启动开发模式

```bash
pnpm dev               # 同时启动 api (4000) + web (5173)
```

- 前端：<http://localhost:5173>
- API：<http://localhost:4000/api/healthz>

### 5. 构建 + 启动生产模式

```bash
pnpm build             # 构建前端到 apps/web/dist
pnpm start             # 仅启动 api
```

## 🤖 外部 Agent 接入（Q5 留的口子）

你的 hermes agent 可以直接通过 HTTP 推送 markdown：

### 推送一篇文章

```bash
curl -X POST http://localhost:4000/api/agent/publish \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "2026-06-04-new-post.md",
    "content": "# 标题\n\n正文内容...",
    "encoding": "utf-8"
  }'
```

### Base64 编码（适合二进制安全）

```bash
curl -X POST http://localhost:4000/api/agent/publish \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "2026-06-04-image-heavy.md",
    "content": "BASE64_ENCODED_CONTENT",
    "encoding": "base64"
  }'
```

### 启用 API Key 鉴权

在 `.env` 设置 `AGENT_API_KEY=your-secret-key`，调用时携带：

```bash
curl -X POST http://localhost:4000/api/agent/publish \
  -H "Content-Type: application/json" \
  -H "X-Agent-Key: your-secret-key" \
  -d '{ ... }'
```

### 直接放 .md 到 inbox

最简单的方式 — agent 把 .md 文件写到 `content/inbox/`：

```bash
# 在服务器上
cat > /opt/blog-platform/content/inbox/2026-06-04-new.md <<'EOF'
---
title: 我的新文章
slug: my-new-post
date: 2026-06-04
tags: [AI, Agent]
summary: 文章摘要
status: published
---

# 正文
EOF
# chokidar 会自动检测并收录，无需任何额外命令
```

## 📡 API 速查

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/healthz` | 健康检查 |
| GET | `/api/posts?page=&tag=&q=` | 文章列表（分页/标签/搜索）|
| GET | `/api/posts/:slug` | 文章详情 |
| GET | `/api/posts/:slug/download` | 下载 `.md` |
| POST | `/api/posts/batch-download` | zip 批量下载 |
| POST | `/api/posts/:slug/pdf` | 导出 PDF（占位，需 puppeteer）|
| POST | `/api/posts` | 创建文章（无鉴权 v1）|
| PUT | `/api/posts/:slug` | 更新文章 |
| DELETE | `/api/posts/:slug` | 删除文章 |
| GET | `/api/tags` | 标签列表 |
| GET | `/api/search?q=` | 全文搜索 |
| POST | `/api/files/upload` | 上传 .md 到 inbox |
| GET | `/api/inbox` | 查看 inbox 文件 |
| POST | `/api/inbox/ingest` | 手动触发收录 |
| GET | `/api/agent/health` | Agent 端点健康检查 |
| POST | `/api/agent/publish` | Agent 推送 markdown |
| GET | `/api/feed.xml` | RSS 2.0 |
| GET | `/api/atom.xml` | Atom 1.0 |

## 📝 Markdown Frontmatter 约定

```markdown
---
title: 文章标题
slug: my-post-slug
date: 2026-06-04 12:00:00
tags: [AI, Agent, TypeScript]
summary: 一句话简介
status: published
cover: /uploads/2026/06/cover.png
---

# 正文开始

支持完整 GFM（GitHub Flavored Markdown）：
- 表格、任务列表、删除线
- 代码块（自动高亮）
- 图片、链接、引用
```

## 🚢 部署到自有 Linux 服务器

### 一键部署

```bash
# 在服务器上
git clone <repo-url> /opt/blog-platform
cd /opt/blog-platform
chmod +x scripts/deploy.sh
DOMAIN=blog.example.com ./scripts/deploy.sh --seed
```

脚本会自动：
1. 拉取最新代码
2. `pnpm install`
3. 数据库迁移 + seed
4. 构建前端
5. 用 PM2 启动后端
6. 配置 Nginx

### 手动部署

详见 `deploy/nginx.conf` 和 `ecosystem.config.cjs`。

### HTTPS

```bash
sudo certbot --nginx -d blog.example.com
```

## 🔧 维护

### 查看日志

```bash
pm2 logs blog-api
```

### 重启服务

```bash
pm2 restart blog-api
```

### 数据库备份

```bash
# SQLite 支持热备份
sqlite3 data/blog.db ".backup '/backup/blog-$(date +%F).db'"
```

### 重建搜索索引

应用启动时会自动重建（rebuildIndex）。也可手动触发：重启服务即可。

## 🐛 故障排查

| 问题 | 原因 | 解决 |
|---|---|---|
| `pnpm` 找不到 | corepack 未启用 | `corepack enable pnpm` |
| 启动报 `node:sqlite` 错误 | Node 版本 < 22.13 + pnpm 11 | 用 pnpm 9.x：`corepack prepare pnpm@9.15.4 --activate` |
| inbox 文件没被收录 | chokidar 没启动 | 检查 `WATCH_INBOX=true` |
| 端口被占用 | 4000/5173 | `lsof -i :4000` 查进程 |
| 静态资源 404 | Nginx root 路径不对 | 修改 `deploy/nginx.conf` 里的 `root` |

## 📜 文档

- 计划文档：`.sisyphus/plans/blog-platform.md`
- 决策记录：`.sisyphus/notepads/blog-platform/decisions.md`
- 经验记录：`.sisyphus/notepads/blog-platform/learnings.md`
- 风险记录：`.sisyphus/notepads/blog-platform/problems.md`

## 📄 License

MIT

