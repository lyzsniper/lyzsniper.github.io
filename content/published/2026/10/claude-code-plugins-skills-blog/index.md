# Agent 工具扩展体系参考清单：Plugin 与 Skill 总览

`SKILL.md` 是被多款 AI Agent 工具支持的开放扩展格式，覆盖 Claude Code、Codex、Cursor、Gemini CLI、OpenClaw 等十余款主流 Agent。本清单按使用场景组织，所有项目均标注 GitHub 源，部分附真实 `SKILL.md` frontmatter 摘录，可作为安装与选型的参考文档。

> 通用安装路径：`~/.claude/skills/<name>/SKILL.md`（Claude Code / Codex / Cursor / OpenClaw 等），或通过 `npx skills add <repo>`（需该 Agent 提供 npx 适配层）。

---

## 1. 核心能力库

| 名称 | GitHub | 用途 |
|------|--------|------|
| superpowers | https://github.com/obra/superpowers | TDD/调试/协作核心库 |

## 2. 浏览器与网络

适用于网页抓取、登录态操作、跨平台调研、社媒内容获取。

| 名称 | GitHub | 用途 |
|------|--------|------|
| web-access | https://github.com/eze-is/web-access | CDP 控制本地浏览器，处理登录态 |
| browse (gstack) | https://github.com/garrytan/gstack | headless 浏览器，截图/QA 证据 |
| agent-reach | https://github.com/Panniantong/Agent-Reach | 多平台社媒调研，支持 15 平台 |

**web-access 真实 frontmatter：**

```yaml
---
name: web-access
license: MIT
github: https://github.com/eze-is/web-access
description:
  所有联网操作必须通过此 skill 处理，包括：搜索、网页抓取、登录后操作、网络交互等。
  触发场景：用户要求搜索信息、查看网页内容、访问需要登录的网站、操作网页界面、
  抓取社交媒体内容（小红书、微博、推特等）、读取动态渲染页面、以及任何需要真实
  浏览器环境的网络任务。
metadata:
  author: 一泽Eze
  version: "2.5.3"
---
```

**agent-reach 真实 frontmatter（节选）：**

```yaml
---
name: agent-reach
description: >
  MUST USE when user wants to 调研/research/搜索/search/查/找/look up anything
  on the internet. 15 platforms, multi-backend routing (OpenCLI / per-platform
  CLIs / APIs). Zero config for 6 channels.
  分类：search / social / career / dev / web / video / finance.
triggers:
  - research: 调研/全网调研
  - search: 搜/查/找
  - social: 小红书/Twitter/B站/V2EX/Reddit/Facebook/Instagram
metadata:
  openclaw:
    homepage: https://github.com/Panniantong/Agent-Reach
---
```

## 3. 工程实践

近期工程社区推荐清单中的一站式工程实践包，覆盖 API 设计、调试、Code Review、CI/CD、性能优化等主题。

| 名称 | GitHub | 用途 |
|------|--------|------|
| agent-skills (addyosmani 全包) | https://github.com/addyosmani/agent-skills | 一条命令装 24 主题工程实践 |

**包含的主题（节选）：** `api-and-interface-design`、`frontend-ui-engineering`、`codebase-design`、`domain-modeling`、`context-engineering`、`planning-and-task-breakdown`、`spec-driven-development`、`tdd`、`debugging-and-error-recovery`、`diagnosing-bugs`、`code-review-and-quality`、`code-simplification`、`security-and-hardening`、`performance-optimization`、`observability-and-instrumentation`、`ci-cd-and-automation`、`git-workflow-and-versioning`、`documentation-and-adrs`、`shipping-and-launch`、`browser-testing-with-devtools`、`find-skills`、`using-agent-skills` 等。

> 安装方式：`npx skills add addyosmani/agent-skills`，自动兼容 Claude Code、Codex、Cursor、OpenClaw、Gemini CLI 等十余款 Agent。

## 4. 设计与前端

用于网页、PPT、海报、原型的视觉生成，强调反 AI 模板化与高端 agency 风格。

| 名称 | GitHub | 用途 |
|------|--------|------|
| guizang-ppt | https://github.com/op7418/guizang-ppt-Skill | 网页 PPT，杂志/瑞士双风格 |
| html-anything | https://github.com/nexu-io/html-anything | Markdown 转 9 形态 HTML 模板 |
| hyperframes | https://github.com/heygen-com/hyperframes | HTML/CSS 转 MP4 视频 |
| design-taste-frontend | gstack 内置 | 反 AI slop 前端生成 |
| minimalist-ui | gstack 内置 | 极简编辑风格 |
| industrial-brutalist-ui | gstack 内置 | 粗野主义 UI |
| high-end-visual-design | gstack 内置 | 高端 agency 视觉设计 |
| stitch-design-taste | gstack 内置 | Google Stitch 语义设计 |
| image-to-code / imagegen-frontend-web/mobile | gstack 内置 | 设计图/方向图 → 代码 |

**guizang-ppt 真实 frontmatter：**

```yaml
---
name: guizang-ppt-skill
description: 生成横向翻页网页 PPT（单 HTML 文件），含 WebGL 背景、章节幕封、
  数据大字报、图片网格等模板。提供两种风格：① "电子杂志 × 电子墨水"
  （衬线 + 流体背景 + 暖色） ② "瑞士国际主义"（无衬线 + 网格点阵 +
  IKB/柠檬黄/柠檬绿/安全橙高亮）。
---
```

> 注：`html-anything` 主分支根目录无 `SKILL.md`（HTTP 404 已确认），元数据以 README 徽章形式内嵌，Apache-2.0 许可。

## 5. 科研

覆盖医学科研全流程与通用科研工作流（文献发现、Zotero/Obsidian 收纳、NotebookLM 上传）。

| 名称 | GitHub | 用途 |
|------|--------|------|
| medsci-skills | https://github.com/Aperivue/medsci-skills | 临床/医学科研全流程，56 子 |
| research-hub | https://github.com/WenyuChiou/research-hub | 通用科研工作流，11 子 |

**medsci-skills（write-paper 子 skill）真实 frontmatter：**

```yaml
---
name: write-paper
description: Full-pipeline medical/scientific paper writing. 8-phase IMRAD
  workflow from outline to submission-ready manuscript. Supports original
  articles, case reports, case series, meta-analyses, AI validation studies.
triggers: write paper, manuscript, draft paper, start writing
tools: Read, Write, Edit, Bash, Grep, Glob
model: inherit
---
```

**research-hub 真实 frontmatter：**

```yaml
---
name: research-hub
description: Operate research-hub workflows for literature discovery, source
  ingest into Zotero/Obsidian/NotebookLM, dashboard inspection, and vault
  maintenance.
---
```

## 6. Office 文档

| 名称 | GitHub | 用途 |
|------|--------|------|
| officecli | https://github.com/iOfficeAI/OfficeCLI | Word/Excel/PPT 命令行处理 |

**officecli 真实 frontmatter：**

```yaml
---
name: officecli
description: Create, analyze, proofread, and modify Office documents
  (.docx, .xlsx, .pptx) using the officecli CLI tool. Use when the user
  wants to create, inspect, check formatting, find issues, add charts,
  or modify Office documents.
---
```

## 7. 数据可视化

| 名称 | GitHub | 用途 |
|------|--------|------|
| dataviz | gstack 内置 | 图表设计系统与方法 |

## 8. 代码分析

| 名称 | GitHub | 用途 |
|------|--------|------|
| ast-analyzer | 社区 | AST 静态分析与依赖图 |
| ocr | 社区 | OCR 识别 |
| gitnexus | https://github.com/abhigyanpatwari/GitNexus | 代码知识图谱 |
| github-pick-deck | 社区 | GitHub 项目 deck 生成 |

## 9. 安全与防护

| 名称 | GitHub | 用途 |
|------|--------|------|
| guard | gstack 内置 | 全量安全模式 |
| careful | gstack 内置 | 破坏性命令确认 |
| freeze | gstack 内置 | 限定编辑目录 |
| unfreeze | gstack 内置 | 解除 freeze 限制 |

**browse (gstack) 真实 frontmatter：**

```yaml
---
name: browse
preamble-tier: 1
version: 1.1.0
description: Fast headless browser for QA testing and site dogfooding. (gstack)
triggers:
  - browse a page
  - headless browser
  - take page screenshot
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---
```

---

## 汇总表

| 名称 | 类型 | 场景 | GitHub |
|------|------|------|--------|
| superpowers | Plugin | 核心能力库 | https://github.com/obra/superpowers |
| web-access | Skill | 浏览器/网络 | https://github.com/eze-is/web-access |
| browse | Skill | 浏览器/网络 | https://github.com/garrytan/gstack |
| agent-reach | Skill | 浏览器/网络 | https://github.com/Panniantong/Agent-Reach |
| agent-skills | Skill | 工程实践 | https://github.com/addyosmani/agent-skills |
| guizang-ppt | Skill | 设计与前端 | https://github.com/op7418/guizang-ppt-Skill |
| html-anything | Skill | 设计与前端 | https://github.com/nexu-io/html-anything |
| hyperframes | Skill | 设计与前端 | https://github.com/heygen-com/hyperframes |
| design-taste-frontend | Skill | 设计与前端 | gstack 内置 |
| minimalist-ui | Skill | 设计与前端 | gstack 内置 |
| industrial-brutalist-ui | Skill | 设计与前端 | gstack 内置 |
| high-end-visual-design | Skill | 设计与前端 | gstack 内置 |
| stitch-design-taste | Skill | 设计与前端 | gstack 内置 |
| image-to-code | Skill | 设计与前端 | gstack 内置 |
| imagegen-frontend-web/mobile | Skill | 设计与前端 | gstack 内置 |
| medsci-skills | Skill | 科研 | https://github.com/Aperivue/medsci-skills |
| research-hub | Skill | 科研 | https://github.com/WenyuChiou/research-hub |
| officecli | Skill | Office 文档 | https://github.com/iOfficeAI/OfficeCLI |
| dataviz | Skill | 数据可视化 | gstack 内置 |
| ast-analyzer | Skill | 代码分析 | 社区 |
| ocr | Skill | 代码分析 | 社区 |
| gitnexus | Skill | 代码分析 | https://github.com/abhigyanpatwari/GitNexus |
| github-pick-deck | Skill | 代码分析 | 社区 |
| guard | Skill | 安全/防护 | gstack 内置 |
| careful | Skill | 安全/防护 | gstack 内置 |
| freeze | Skill | 安全/防护 | gstack 内置 |
| unfreeze | Skill | 安全/防护 | gstack 内置 |

---

## 通用安装路径参考

| Agent | 技能目录 | 安装命令 |
|-------|---------|---------|
| Claude Code | `~/.claude/skills/<name>/SKILL.md` | 手动复制，或 `npx skills add <repo>` |
| Codex | `~/.codex/skills/<name>/SKILL.md` | 部分支持 npx skills |
| Cursor | `.cursor/skills/<name>/SKILL.md`（项目级） | 项目级 `.cursor/rules` 或 `SKILL.md` |
| Gemini CLI | `~/.gemini/skills/<name>/SKILL.md` | 手动复制 |
| OpenClaw | `~/.openclaw/skills/<name>/SKILL.md` | `npx skills add <repo>` |
| 通用兼容层 | `~/.agents/skills/<name>/SKILL.md` | 通过 symlink 自动接入各 Agent |
| Antigravity / Aider / Qwen Coder / IBM Bob / OpenCode / GitHub Copilot CLI | 各 Agent 默认扫描路径 | 多通过 `npx skills add <repo>` 一键适配 |
