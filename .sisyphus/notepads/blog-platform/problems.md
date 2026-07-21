# Problems

> 关键阻塞问题、决策、风险。子代理遇到问题或超出范围时记录。

## P1 [2026-06-03] 子代理 100% 失败 — 改用 Atlas 直接实现
**问题**：连续 3 次 task() 委派，30 分钟超时，零产出
- T1 (Phase 0.1 工作区)：超时，0 文件
- T2/T3 (Phase 0 归档 + workspace + web 脚手架)：超时，0 文件
- T4/T5 (Phase 0 apps/web + apps/api 配置)：超时，0 文件

**根因（推测）**：
- 子代理可能因模型问题或框架问题无法正常处理 Write 工具循环
- 每次都"声明完成"但实际未写入
- prompt 大小不应该是问题（T4/T5 只有 8+3 个简单配置）

**决策**：**Phase 0 起由 Atlas 直接写代码**
- 用户已反馈"环境不需要你准备，专注写代码，浪费时间"
- 子代理 100% 失败，继续委派是浪费时间
- System 提示建议 delegate，但在子代理不可用时是 pragmatic exception
- 写完后用 Read + lsp_diagnostics 自验
- 在 notepad 持续记录进展

**影响**：
- 后续 Phase 1-7 也将主要由 Atlas 直接实现
- 复杂多文件任务可能拆为多次 Write 调用

## P2 [2026-06-03] 13 个老 hexo 文件 modified 是 CRLF 行尾
- 已创建 `.gitattributes` 强制 LF
- 用户后续 git add 时会触发 CRLF→LF 转换，工作树会再次显示 modified
- 这是预期行为，git 会自动 normalize

## P3 [2026-06-03] PDF 导出是占位实现
- 完整实现需要 puppeteer-core + 系统 Chromium
- 部署时按需安装：`apt install -y chromium-browser` 或 `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`
- 当前返回 HTML 包装的 buffer，标注 TODO

## P4 [2026-06-03] 无运行时验证
- 用户明确反馈"环境由用户准备"
- 所有 .ts/.tsx 文件**未跑过 tsc/build**
- 用户在 Node 24 + pnpm 9 环境跑 `pnpm install && pnpm typecheck` 后可发现潜在类型错误
- 静态检查：所有 JSON 合法（6 个）、CJS/JS 语法合法（7 个）、TS 文件结构正确

## P5 [2026-06-03] 2023 老文章 seed 是 2 篇手写 markdown
- `content/published/2023/09/hello-world/index.md` — Hello World 占位
- `content/published/2023/09/redis-on-ubuntu/index.md` — Redis 安装配置
- 都写了完整 frontmatter
- 通过 `pnpm --filter @blog/api seed` 触发 ingest 流程入库

## P9 [2026-06-03] Repo 构造时 getDb() 导致 module-load 崩溃
- **症状**：`pnpm seed` 和 `pnpm dev` 报 `DB not initialized. Call initDb() first.`
- **根因**：3 个 repo（PostRepo, TagRepo, IngestLogRepo）类字段初始化 `private db = getDb()` 在模块加载时立即执行
- 但 `initDb()` 是在 server.ts:buildServer() 内部才调用，模块加载早于此
- 所以 routes/posts.ts:10 的 `const postRepo = new PostRepo()` 触发 `getDb()` → db 还是 null → throw
- 之前用户看到的 "DB not initialized" 不是 migrate 的目录 bug 的级联，**是独立的另一个 bug**
- **修复**：3 个 repo 都改成 lazy getter
  ```typescript
  private _db: Database.Database | undefined
  private get db(): Database.Database {
    if (!this._db) this._db = getDb()
    return this._db
  }
  ```
- 这样 `new PostRepo()` 不再触发 `getDb()`，只有第一次实际查询时才取 DB
- 7 处模块顶层 `new XxxRepo()`（routes/posts.ts, routes/tags.ts, routes/feed.ts, services/ingest.ts）现在全部安全
- 静态验证：grep 显示 3 个 repo 都用 lazy pattern，7 处 `new` 不再有问题

## P7 [2026-06-03] DB 路径 bug：root 解析少一层
- **症状**：`pnpm migrate` 报 `Cannot open database because the directory does not exist`
- **根因**：`apps/api/src/config.ts` 里 `root = path.resolve(__dirname, '../..')` 解析到 `apps/`
- 应该是项目根（再上一级）→ `path.resolve(__dirname, '../../..')`
- 修复后 `data/blog.db` 路径正确指向 `<project>/data/blog.db`
- 顺手加了 `initDb()` 里的 `fs.mkdirSync` 保险，自动创建 data/inbox/drafts/published/uploads
- 同步添加了 `siteUrl` 配置到 config
- **影响**：`pnpm migrate` 自动 work

## P8 [2026-06-03] 视觉重写：完整复刻原 index.html
- **症状**：用户反馈"很多视觉效果都被你优化掉了，和以前不一样"
- **缺失**：
  - 粒子网络背景（canvas + 鼠标交互）
  - 网格 overlay（固定背景）
  - 扫描线（10s 循环）
  - 浮动代码片段
  - Reveal 滚动动画（IntersectionObserver）
  - 终端打字机效果（4 行 + cursor 闪烁）
  - 滚动指示器
  - 完整 hero（中文渐变标题 + 联系信息条）
  - 完整 about（双 ring 旋转 + JZ 头像）
  - 4 大类 13 张 3D skill 卡片
  - 4 个项目卡片（含 period + role + tech tags）
  - 3 个原版 advantage 卡片
  - 多列 footer
- **修复**：
  - 新增 `apps/web/src/components/BackgroundFX.tsx`（粒子 + 网格 + 扫描线 + 浮动代码 + Reveal observer）
  - 完整重写 `apps/web/src/pages/Home.tsx`（560 行，5 个 section）
  - 完整重写 `apps/web/src/components/Footer.tsx`（品牌 + 链接 + 联系 + bottom）
  - 扩展 `apps/web/src/styles/globals.css`（+250 行，所有动画 + 卡片样式）
