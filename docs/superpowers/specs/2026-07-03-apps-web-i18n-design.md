# apps/web 多语言（i18n）设计 — Sub-project 1: UI 国际化

> 日期：2026-07-03
> 范围：`apps/web/` 内 21 个 UI 文件（12 页 + 9 组件），不含博客 Markdown 内容
> 不在本 spec 范围：博客内容翻译（下一个 sub-project）、根目录 `index.html`（按已确认方案 A 删除）
> 目标受众：面向全球同行与合作者，英文可作为同等地位入口

---

## 1. 背景与动机

当前 `apps/web/` 是**纯中文**的 React SPA（21 个 UI 文件全部含硬编码中文）。访客群体如果含非中文母语者（英文 / 其它），存在进入障碍。

**已确认的 6 个核心决策**（来自 brainstorming）：

| 决策 | 选择 |
|---|---|
| 范围 | Sub-project 1 = 仅 UI i18n（不含博客内容、不含根目录 index.html） |
| 技术路线 | react-i18next + i18next + i18next-browser-languagedetector |
| URL 策略 | 中文默认 `/`，英文 `/en/` 前缀 |
| 切换器 | Header 加 🌐 地球图标下拉 |
| 检测 | 首次访问根据浏览器语言（`navigator.language`），后续记 localStorage |
| 翻译策略 | AI 批量 + 你手工 review Home/Blog/Post + 我 spot-check 后台 18 个 |

---

## 2. 设计目标

- 全部 21 个 UI 文件的硬编码中文字符串迁移到 `i18n/locales/{zh,en}/*.json`
- 路由加 `/en/` 前缀支持，URL 与 i18n state 双向同步
- 首次访问根据浏览器语言自动决定 zh/en；用户手动切换后记 localStorage
- 翻译质量：技术术语（RAG / MCP / A2A / LangGraph / CrewAI / Dify / Coze / vLLM 等）保留英文
- 工程观点段（Hero 副标、能力矩阵立场句、核心优势 pull-quote）需要准确传达

---

## 3. 视觉 / 交互气质

- 不引入新视觉语言，沿用现有 design system（indigo accent、`btn`、`pill`、`surface-card`）
- 切换器与 ThemeToggle 并列在 Header 右上角；尺寸一致
- 切换器不展开时仅显示 🌐 图标 + 当前语言文字（"中" / "EN"）
- 点击展开下拉（绝对定位、`surface-card` 背景、`border-subtle` 边），两项

---

## 4. 技术架构

### 4.1 依赖新增

```json
// apps/web/package.json dependencies
{
  "i18next": "^23.16.0",
  "react-i18next": "^15.1.0",
  "i18next-browser-languagedetector": "^8.0.0"
}
```

**无新增 peer 依赖**（与 React 18、react-router-dom 6 兼容）。

### 4.2 目录结构

```
apps/web/src/
├── i18n/
│   ├── index.ts                 # i18next init 入口
│   └── locales/
│       ├── zh/
│       │   ├── common.json
│       │   ├── header.json
│       │   ├── footer.json
│       │   ├── postcard.json
│       │   ├── home.json
│       │   ├── blog.json
│       │   ├── post.json
│       │   ├── search.json
│       │   ├── tags.json
│       │   ├── notfound.json
│       │   ├── login.json
│       │   ├── admin.json
│       │   ├── editor.json
│       │   ├── inbox.json
│       │   └── tagmanage.json
│       └── en/
│           └── ... (镜像 15 个)
```

**15 个 namespace × 2 语言 = 30 个 JSON 文件。**

### 4.3 i18n 初始化

**`apps/web/src/i18n/index.ts`：**

```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import zhCommon from './locales/zh/common.json'
import enCommon from './locales/en/common.json'
// ... 其它 14 个 namespace

export const supportedLngs = ['zh', 'en'] as const
export const fallbackLng = 'zh'
export const defaultNS = 'common'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng,
    defaultNS,
    supportedLngs: [...supportedLngs],
    ns: [
      'common', 'header', 'footer', 'postcard',
      'home', 'blog', 'post', 'search', 'tags', 'notfound',
      'login', 'admin', 'editor', 'inbox', 'tagmanage',
    ],
    detection: {
      order: ['path', 'localStorage', 'navigator'],
      lookupFromPathIndex: 0,  // 检测 /en/... 的 'en'
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: { escapeValue: false },
  })

export default i18n
```

**`main.tsx` 改动：** 在最外层 `import './i18n'`（副作用 init），不强制包 Provider（react-i18next 内部已挂 React context）。

### 4.4 路由策略

**不重写 react-router 路由**。URL 状态由 useLocation 检测：

```ts
// apps/web/src/i18n/useLanguageFromUrl.ts
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function useLanguageSwitch() {
  const { i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const isEnglish = location.pathname.startsWith('/en')
  const currentLng = isEnglish ? 'en' : 'zh'

  const switchLanguage = (target: 'zh' | 'en') => {
    if (target === currentLng) return
    let newPath: string
    if (target === 'en') {
      newPath = location.pathname.startsWith('/en')
        ? location.pathname
        : `/en${location.pathname === '/' ? '' : location.pathname}`
    } else {
      newPath = location.pathname.replace(/^\/en/, '') || '/'
    }
    void i18n.changeLanguage(target)
    navigate(newPath)
  }

  return { currentLng, switchLanguage }
}
```

**App.tsx 副作用：** 路由变化时同步 i18next state：

```tsx
// 在 App 内 useEffect
const { i18n } = useTranslation()
const location = useLocation()
useEffect(() => {
  const lng = location.pathname.startsWith('/en') ? 'en' : 'zh'
  if (i18n.language !== lng) {
    void i18n.changeLanguage(lng)
  }
}, [location.pathname, i18n])
```

### 4.5 切换器组件

**`apps/web/src/components/LanguageSwitcher.tsx`（新文件）：**

```tsx
import { Globe, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguageSwitch } from '@/i18n/useLanguageFromUrl'
import { useState, useRef, useEffect } from 'react'

const LANGS = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
] as const

export default function LanguageSwitcher() {
  const { t } = useTranslation('common')
  const { currentLng, switchLanguage } = useLanguageSwitch()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-ghost btn-sm flex items-center gap-1.5"
        aria-label={t('language.switch')}
        aria-expanded={open}
      >
        <Globe size={14} />
        <span className="text-xs font-medium">
          {currentLng === 'zh' ? '中' : 'EN'}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 min-w-[140px] surface-card py-1 z-50"
        >
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitem"
              onClick={() => {
                switchLanguage(l.code)
                setOpen(false)
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[var(--bg-muted)] transition-colors"
            >
              <span>{l.label}</span>
              {currentLng === l.code && <Check size={14} className="text-[var(--accent)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Header.tsx 集成：** 在 ThemeToggle 旁插入 `<LanguageSwitcher />`。

**如果 `btn-ghost` / `btn-sm` 不存在**——降级到现有 `btn-secondary` + 自定义 class。

### 4.6 useTranslation namespace 映射

| 文件 | namespace | 备注 |
|---|---|---|
| `components/Header.tsx` | `['common', 'header']` | 导航 + 通用按钮 |
| `components/Footer.tsx` | `['common', 'footer']` | 页脚 |
| `components/Layout.tsx` | `['common']` | 通用 |
| `components/PostCard.tsx` | `['common', 'postcard']` | 博客卡片 |
| `components/ThemeToggle.tsx` | `['common']` | aria-label 翻译 |
| `components/ProtectedRoute.tsx` | `['common']` | 登录提示 |
| `components/SkillGraph3D.tsx` | `['home']` | 节点 label 复用 home 命名空间 |
| `pages/Home.tsx` | `['common', 'home']` | Hero/About/能力矩阵/核心优势 |
| `pages/Blog.tsx` | `['common', 'blog']` | 列表 |
| `pages/Post.tsx` | `['common', 'post']` | 详情 |
| `pages/Search.tsx` | `['common', 'search']` | 搜索 |
| `pages/Tags.tsx` | `['common', 'tags']` | 标签 |
| `pages/NotFound.tsx` | `['notfound']` | 404 |
| `pages/Login.tsx` | `['login']` | 登录 |
| `pages/Admin.tsx` | `['admin']` | 后台 |
| `pages/Editor.tsx` | `['editor']` | 后台 |
| `pages/Inbox.tsx` | `['inbox']` | 后台 |
| `pages/TagManage.tsx` | `['tagmanage']` | 后台 |

### 4.7 变量插值与复数

```tsx
// 插值
t('tags.count', { count: 12 })
// zh.json: "count": "共 {{count}} 个标签"
// en.json: "count_one": "{{count}} tag", "count_other": "{{count}} tags"

// 复数（i18next 语法）
t('comments.count', { count: 5 })
// zh.json: "count": "{{count}} 条评论"
// en.json: "count_one": "{{count}} comment", "count_other": "{{count}} comments"
```

### 4.8 翻译术语保留

**技术术语（保留英文，不翻译）：**
RAG, MCP, A2A, LangGraph, LangChain, CrewAI, ADK, Dify, Coze, vLLM, Qwen, LlamaIndex, Haystack, ReAct, Plan-Execute, Multi-Agent Debate, Java, Spring Boot, JVM, FastAPI, MySQL, PostgreSQL, Redis, ElasticSearch, Milvus, Kafka, RocketMQ, Docker, Kubernetes, Prometheus, Grafana, React, TypeScript, Vite, Tailwind, Claude Code, Cursor

**公司/产品名（保留原文）：**
Spring AI, DeepSpeed, AWQ, LSP, Qwen 3 MoE, PyTorch, Nacos, Skywalking, ELK, Tugraph

**人名/职衔翻译：**
- "刘酝泽" → "Jensen"（英文模式显示英文名）
- "AI Agent 架构师" → "AI Agent Architect"
- "全栈开发者" → "Full-Stack Developer"
- "后端开发组长" → "Backend Lead"（如保留在 Admin 页面）

---

## 5. 实施分阶段

### 阶段 0：分支与合并
1. 切换到 master：`git checkout master`
2. 合并 dev/0.0.1：`git merge dev/0.0.1 --no-ff`（保留分支历史）
3. 创建新分支：`git checkout -b feature/i18n-ui`
4. **本 spec 在新分支 commit**

### 阶段 1：基础设施
1. `pnpm add i18next react-i18next i18next-browser-languagedetector` 在 `apps/web`
2. 创建 `i18n/index.ts` + `i18n/useLanguageFromUrl.ts`
3. 创建 `i18n/locales/{zh,en}/common.json`（先做这一对，让 App 能跑）
4. `main.tsx` 添加 `import './i18n'`
5. `App.tsx` 添加 URL → i18n 同步 effect

### 阶段 2：切换器
1. 创建 `components/LanguageSwitcher.tsx`
2. `Header.tsx` 集成（在 ThemeToggle 旁）
3. 视觉验证：手动切到 `/en/`，UI 应变成英文

### 阶段 3：21 文件逐一迁移（按 6 个 sub-batch）
- **Batch A — 公共组件**（5 个）：Header、Footer、Layout、PostCard、ThemeToggle、ProtectedRoute
- **Batch B — 公开页面核心**（2 个）：Home、Blog
- **Batch C — 公开页面次要**（3 个）：Post、Search、Tags
- **Batch D — 公开页面边角**（2 个）：NotFound、Login
- **Batch E — 后台页面**（4 个）：Admin、Editor、Inbox、TagManage
- **Batch F — 数据**（1 个）：SkillGraph3D 节点 label（复用 home ns）

每 batch：1 个 commit。

### 阶段 4：删除根目录 index.html
- `git rm index.html` + 1 个 commit

### 阶段 5：Review
1. 我先 spot-check 全部 30 个 JSON
2. 你 review 3 个核心公开页（Home / Blog / Post）
3. 修补翻译

---

## 6. 验收标准

- 21 个 UI 文件 `grep -E "[一-鿿]"` 在 JSX 文本节点中**仅**保留：技术术语注释、动态内容（如 username）、fallback 字面量
- 30 个 JSON 文件全部 commit
- 路由访问 `/` 显示中文、`/en/` 显示英文、互相切换 URL 同步
- localStorage 写入 `i18nextLng: 'zh' | 'en'`
- pnpm build 成功，bundle 体积增加 < 100KB（i18next + react-i18next 总和）
- 后台页面（Admin/Editor 等）在 EN 模式下 UI 是英文，业务数据/中文输入框仍按用户输入

---

## 7. 不做的事（Out of Scope）

- ❌ 博客 Markdown 内容翻译（Sub-project 2）
- ❌ 根目录 `index.html` 国际化（已删）
- ❌ SSR / SSG（项目是 CSR SPA）
- ❌ 切换器以外的更多语言（日语、韩语等）
- ❌ 内容协商（Accept-Language header 路由——项目是 SPA，无需）
- ❌ 翻译管理平台（Crowdin / Lokalise 等）
- ❌ 抽取运行时 t 函数为编译时宏（性能优化，非必需）

---

## 8. 风险与回滚

- 单 spec 改动文件：~35 个（21 组件 + 14 JSON + 配置 + 切换器 + index.html 删除）
- 回滚：`git revert` 整个 spec 系列 commit 即可
- localStorage 兼容：用户首次访问检测失败时降级到中文
- URL 不带 /en/ 的老链接：直接走中文，访问者手动切换可去 /en/

---

## 9. 依赖关系

- 前置：dev/0.0.1 已合并到 master
- 不阻塞：博客内容翻译（独立 sub-project）

---

## 10. Review 工作流（你和我）

| 文件 | 我 | 你 |
|---|---|---|
| `apps/web/src/i18n/locales/zh/home.json` | 起草 | 逐键 review |
| `apps/web/src/i18n/locales/en/home.json` | 起草 | 逐键 review |
| `apps/web/src/i18n/locales/zh/blog.json` | 起草 | 逐键 review |
| `apps/web/src/i18n/locales/en/blog.json` | 起草 | 逐键 review |
| `apps/web/src/i18n/locales/zh/post.json` | 起草 | 逐键 review |
| `apps/web/src/i18n/locales/en/post.json` | 起草 | 逐键 review |
| 其它 24 个 JSON | 起草 + 终审 | spot-check（如发现大问题指出） |

**Review 形式：** 我会列出每个文件的 key 表格（中文原文 + 我的英译），你说"OK / 改 XX"。

---

## 11. 估算

| 阶段 | 估时 |
|---|---|
| 阶段 0 分支与合并 | 5 min |
| 阶段 1 基础设施 | 30 min |
| 阶段 2 切换器 | 30 min |
| 阶段 3 迁移 21 文件 | 2-3 hours |
| 阶段 4 删 index.html | 5 min |
| 阶段 5 Review | 1-2 hours（你）+ 30 min（我） |
| **总计** | **~5-6 hours** |

按工作量，这是**单次专注会话**或**两个会话**能完成。
