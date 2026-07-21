# 博客平台演进路线图

> 创建日期：2026-07-08
> 最近更新：2026-07-08
> 状态：类别 1 + 2 已全部实现；类别 3-4 部分待后续
> 范围：功能增强 / 体验打磨 / 工程优化 / 差异化能力

---

## 0. 现状速览

| 维度 | 已有能力 |
|---|---|
| 视觉 | neon 风格首页 + 3D 技能图谱 + 暗/亮主题 |
| 创作 | 双栏 Markdown 编辑器 + 多渠道发布（手动 / .md / Agent API） |
| 内容 | 标签 / FlexSearch 全文搜索 / 阅读时间 / 浏览数 / RSS + Atom |
| 国际化 | 中英双语 + URL 同步（`/zh/`、`/en/`） |
| 自动化 | chokidar 监控 inbox + node-cron 兜底 |
| 权限 | 认证模块 + 管理员保护下载 |
| 工程 | Fastify + SQLite + PM2 + Nginx |

下一步值得投入的方向在下面四块，按"价值 / 难度比"排序。

---

## 1. 高价值 · 中等难度（建议优先做）

### 1.1 TOC 目录导航
- **现状**：长文章无目录，读者在长文中容易迷失
- **建议**：rehype-slug 已经把 heading 标了 id，差一个 TOC 组件
  - 右侧悬浮 TOC，滚动联动高亮当前章节
  - 移动端折叠为顶部"目录"按钮
  - 复用 markdown AST 即可，无需新依赖

### 1.2 相关文章推荐
- **现状**：读完一篇文章就到结尾了，无下一步引导
- **建议**：基于标签 + 内容相似度，做"你可能还喜欢"
  - 标签匹配权重 0.6 + FlexSearch 相似度 0.4
  - 详情页底部展示 3-5 篇
  - 复用现有 search 索引，零新依赖

### 1.3 SEO 完整化
- **现状**：只有 RSS/Atom，搜索引擎收录不友好；双语站尤其需要 canonical
- **建议**：
  - `sitemap.xml` 自动生成（按 published 目录扫描 + API 兜底）
  - `robots.txt`
  - Open Graph + Twitter Card meta（封面、标题、摘要）
  - JSON-LD `Article` 结构化数据
  - `<link rel="alternate" hreflang>` + canonical（zh/en 两版互指）

### 1.4 评论 / 反馈
- **现状**：完全单向发布，读者无反馈通道
- **方案对比**：
  - 方案 A：**Giscus**（GitHub Discussions 嵌入）—— 零运维、有版主体系、样式可定制
  - 方案 B：自建（SQLite + 简易反垃圾）—— 完全可控但要管存储/审核
  - 方案 C：第三方（Waline / Twikoo）—— 折中
- **推荐**：方案 A（博客作者即 GitHub 用户，零成本）

### 1.5 系列文章 + 上下篇
- **现状**：文章是平铺的
- **建议**：
  - frontmatter 加 `series: "Agent 实战"` 字段
  - 详情页底部加上一篇/下一篇 + 系列进度条（"第 3/8 篇"）
  - Blog 列表页加"系列"分组筛选

---

## 2. 体验打磨（视觉/交互）

### 2.1 PWA + 离线访问
- `vite-plugin-pwa` 注入 service worker
- 缓存壳 + 已访问文章
- 桌面可"安装"为应用

### 2.2 阅读进度条 + 一键分享
- 顶部 2px 细线进度条（滚动联动）
- 文章底部"分享到：微博 / 推特 / 微信 / 复制链接"

### 2.3 图片懒加载 + 现代格式
- 静态图片转 WebP/AVIF（构建期 sharp 处理）
- `<img loading="lazy" decoding="async">`
- markdown 图片自动套用

### 2.4 About / Projects / Timeline 页
- 提升个人品牌：About（个人介绍）、Projects（作品集）、Timeline（成长时间轴）
- 招聘 / 合作向访问者一眼能看明白你做什么

### 2.5 友链 / Blogroll
- 独立页面 + 友链申请入口
- 互访流量 + 博客圈社交

---

## 3. AI 能力（与你现有栈天然契合）

### 3.1 AI 自动摘要
- 发布时调用 LLM 生成 1-2 句 TL;DR
- 写入 frontmatter `summary` 字段
- 候选：本地 vLLM / 公开 API（Claude / Qwen）

### 3.2 RAG 问答浮窗 ⭐ 差异化名片
- 访客对单篇文章提问 → 后端 RAG 检索（SQLite + FlexSearch 已有索引）→ LLM 回答
- 右下角悬浮按钮，模态对话框
- **既是一个功能，也是你 Agent 能力的最佳 demo**
- 推荐架构：Fastify 路由 → 检索 top-k → prompt 拼装 → 流式返回

### 3.3 AI 翻译
- 中文首发 → 一键生成英文版草稿入 `content/inbox/`
- 复用 Agent publish 通道
- 翻译风格可配置（直译 / 意译 / 保留术语）

### 3.4 自动标签推荐
- 发布时根据正文内容推荐 1-3 个标签
- 编辑可一键应用
- 可选功能，不强制

---

## 4. 工程向（规模化 / 稳定性）

### 4.1 缓存层
- 列表页 / 详情页加内存 LRU 缓存（5 分钟）
- 写操作（发布 / 编辑 / 删除）精准失效
- 无需 Redis，单进程足够

### 4.2 媒体库
- 当前图片散落 `uploads/` 各处
- 建议：统一上传到 `data/media/YYYY/MM/`，生成多尺寸（缩略图 / 完整图）

### 4.3 版本历史
- 每次保存自动快照到 `data/revisions/<slug>/<timestamp>.md`
- 后台可看 diff，可回滚
- 用 `diff-match-patch` 算 diff 即可

### 4.4 Webhook / 通知
- Agent 推完 / 新评论 / 异常 → 触发回调
- 飞书机器人 / Telegram Bot 通知自己
- 让博客真正"活"起来

### 4.5 统计后台
- Admin 页面加数据看板：PV/UV 趋势、热门文章 Top 10、来源分布、404 统计
- 数据从 `data/access.log` 聚合（自建即可，无需 GA）

### 4.6 Docker 化
- `Dockerfile`（多阶段构建：builder + runtime）
- `docker-compose.yml`（api + web + nginx）
- 一键 `docker compose up -d`
- 服务器迁移成本归零

### 4.7 CI/CD
- GitHub Actions：lint → typecheck → test → build → 部署到服务器
- 减少手动 ssh + pm2 restart

---

## 5. 杀手锏（拉开差距）

### 5.1 "Ask My Blog" 浮窗
> 见 3.2，单列出来强调 —— 这一个功能值回所有其他投入。

### 5.2 GitHub-style Activity Heatmap
- 首页加一个贡献热力图（基于 published 时间，53 周 × 7 天格子）
- 视觉上立刻有"持续输出"的信号
- 数据：直接从 `content/published/` 目录扫 frontmatter `date`

### 5.3 代码运行沙箱
- 技术文章内嵌的代码块可一键"在沙箱运行"
- WebContainer / StackBlitz SDK
- 适合你这种 Agent / 代码向博客

---

## 6. 选型决策

如果只能选 3 个先做，我建议：

1. **TOC + 阅读进度 + 相关文章**（一整套阅读体验升级）—— 立竿见影，长文友好
2. **SEO 完整化** —— 双语博客必做，搜索流量入口
3. **Ask My Blog / RAG 浮窗** —— 既是功能又是你的 Agent 能力秀场

---

## 7. 开放问题

- 评论系统选 Giscus 还是自建？需要权衡"零运维 vs 完全可控"。
- 是否引入 Docker 作为未来部署标准？还是继续 PM2 + Nginx？
- AI 能力用本地模型还是调 API？影响成本与隐私。
- 是否要做 Newsletter（邮件订阅）？涉及合规（GDPR / 国内备案）。

---

---

## 8. 已完成（2026-07-08）

### 类别 1 — 高价值 · 中等难度

| # | 功能 | 实现要点 |
|---|---|---|
| 1.1 | TOC 目录导航 | **升级**现有 TocNav：桌面端右侧 sticky 浮窗（滚动高亮 + 左侧指示条）；移动端右上角浮动按钮 → 右侧抽屉 |
| 1.2 | 相关推荐 | 新增 `GET /api/posts/:slug/related`：0.6×标签匹配 + 0.4×FlexSearch 相似度；前端 RelatedPosts 组件 2 列卡片 |
| 1.3 | SEO 完整化 | 后端 `/sitemap.xml`（hreflang x-default / zh / en）+ `/robots.txt`；前端 `useHead` 钩子动态注入 OG / Twitter Card / JSON-LD / canonical / hreflang（覆盖首页 + 文章 + 4 个新页面） |
| 1.4 | 评论系统 | 新建 `comments` 表 + `comments.ts` 路由 / 服务；前端 CommentSection（树形回复 + 表单 + i18n）；反垃圾：URL 上限 / 60s IP 节流 / `<script>` 过滤 |
| 1.5 | 系列文章 | `posts` 表加 `series`/`series_order` 列；前端 SeriesNav 组件（系列进度条 + 上下篇卡片） |

### 类别 2 — 体验打磨

| # | 功能 | 实现要点 |
|---|---|---|
| 2.1 | PWA + 离线 | `vite-plugin-pwa` autoUpdate；manifest (name/icons/theme)；runtimeCaching 覆盖 `/api/posts*` |
| 2.2 | 一键分享 | ShareButtons 组件：微博 / Twitter / 知乎 / 复制链接（带回退 Clipboard） |
| 2.3 | 图片懒加载 | `ReactMarkdown` components 注入 `LazyImage`：`loading="lazy"` + `decoding="async"` |
| 2.4 | About / Projects / Timeline 页 | 4 个骨架页（含 i18n）+ 路由（含 /en）+ Header nav 接入 |
| 2.5 | 友链页 | Blogroll 骨架页（含友链卡片 + 交换友链提示） |

### 新增基础设施

| 项 | 说明 |
|---|---|
| DB 新增表 | `comments`（含 parent_id 回复链、ip / user_agent、status） |
| DB 新增列 | `posts.series`、`posts.series_order` |
| 新增 API | `GET /api/posts/:slug/related`、`GET /api/comments`、`POST /api/comments`、`GET /sitemap.xml`、`GET /robots.txt` |
| 新增前端组件 | TocSidebar、ShareButtons、RelatedPosts、CommentSection、SeriesNav、LazyImage、useHead |
| 新增页面 | About、Projects、Timeline、Blogroll（均含 zh / en 双语） |

### 统计后台（4.5）— 已完成

| 项 | 实现要点 |
|---|---|
| 数据表 | `page_views`（path / post_slug / ip / referrer / user_agent / status_code / created_at）+ 2 索引 |
| 追踪 | Fastify `onResponse` hook 自动记录每次 200 响应；跳过 /api/* / 静态资源 / HEAD；自动推断 `post_slug` |
| API | `GET /api/admin/stats/{overview,trend,hourly,posts,referrers,404s}` — 全部 admin 鉴权 |
| 前端 | `/admin/stats` 看板：4 个 Tab（总览 / 热门文章 / 来源 / 404）；KPI 卡片 + SVG 折线图（7/30/90 天切换）+ 排行榜表格 |
| 图表 | 自研 `SvgLineChart` 组件（零依赖，viewBox 自适应，自动 Y 轴刻度） |
| 入口 | Admin 页"快捷操作"加"数据统计"卡片 |

### 待后续（类别 3-4 未做）

- [ ] 3.1 AI 自动摘要（LLM）
- [ ] 3.2 RAG 问答浮窗
- [ ] 3.3 AI 翻译
- [ ] 3.4 自动标签推荐
- [ ] 4.1 缓存层（LRU）
- [ ] 4.2 媒体库
- [ ] 4.3 版本历史
- [ ] 4.4 Webhook / 通知
- [x] 4.5 统计后台 — 2026-07-08 完成（见下方"统计后台（4.5）"）
- [ ] 4.6 Docker 化
- [ ] 4.7 CI/CD
- [ ] 5.1 Ask My Blog 浮窗
- [ ] 5.2 Activity Heatmap
- [ ] 5.3 代码运行沙箱

---

## 9. 开放问题

- 评论系统已上线但缺"管理员后台审核"界面（v1 只管写入 + 简易反垃圾，`status='approved'` 默认通过；后续需加后台）
- `useHead` 的 OG image 默认靠文章 frontmatter `cover`；若未设置图片字段会退化到 `summary` 卡片 —— **实际效果需在本地 `pnpm dev` + 浏览器验证**
- PWA 图标已配置，但 `pwa-assets.config.ts` 需运行一次 `pwa-assets-generator` 才能生成 `pwa-*.png`（目前 fallback 到 avatar）
- 双语翻译：大部分新增 copy 都已走 i18n，但 Projects/Timeline/Blogroll 内容仍为"占位文案"——由你后续手填
