# Learnings

> 累积执行中学到的技术细节、坑、约定。每条都标时间戳与任务 ID。

## L1 [2026-06-03] 工具链状态
- 当前环境 Node v20.20.2（用户服务器是 Node 24，需向下兼容）
- pnpm 未安装，但 corepack 可用 → `corepack enable pnpm`
- 工作树有 13 个老 hexo 资源 modified，是行尾 CRLF/LF 差异导致（15965 行 insertions/deletions 完美对称）
- 行动：Phase 0.1 必须创建 `.gitattributes` 固定行尾

## L3 [2026-06-03] 用户反馈：环境由用户自己准备
- "环境不需要你准备，你就帮我专注于写代码"
- **新策略**：
  - 不再委派 pnpm/corepack/install/build/start/test 任务
  - 只委派**写文件**的代码任务
  - 用户的 Node 24 + pnpm 由用户自己准备
  - 代码本身按"能在 Node 24 + pnpm 9.x 环境跑"的标准写
  - 子代理 prompt 必须明确：**不要跑 install/build/start**
- 影响：
  - Phase 0.1 跳过（环境配置）
  - 委派纯文件写入（package.json、tsconfig.json、源码等）
  - 我自己用 `node --check` / `tsc --noEmit` / Read 验证代码质量

## L4 [2026-06-03] MD 预览实现说明（给用户解释用）
- **后端解析**：`apps/api/src/lib/markdown.ts`
  - `gray-matter` 解析 frontmatter（YAML）
  - `marked` + `highlight.js` 渲染 md→html（带代码高亮）
  - 自定义 `extractToc` 从 `^#{1,6}` 行生成目录
  - 阅读时长 = `content.length / 500`
- **存储**：DB 存 4 个字段
  - `content_md`：原始 md（编辑器、下载用）
  - `content_html`：服务端预渲染的 html（PDF 用）
  - `toc`：目录结构（前端直接用，避免重复解析）
  - `reading_time`：分钟数
- **前端渲染**：`apps/web/src/pages/Post.tsx`
  - `react-markdown` + `remark-gfm`（GFM 表格/任务列表）
  - `rehype-slug`（标题加 id，TOC 锚点用）
  - `rehype-highlight`（客户端代码高亮）
  - **为什么用 react-markdown 而不是 dangerouslySetInnerHTML**：
    - 安全（自动转义 HTML 防 XSS）
    - 可定制（单独覆盖 a/code/h1 等组件）
    - TypeScript 友好
- **编辑器**：`@uiw/react-md-editor`（双栏编辑+预览）
  - 内部用同一套 react-markdown 生态，所以"所见即所得"
- **light 模式**：`globals.css` 的 `.prose-light` 是一套完整的覆盖样式
  - 用户点 `🌙/🌞` 按钮切换
  - 状态持久化到 `localStorage['blog:read-mode']`




