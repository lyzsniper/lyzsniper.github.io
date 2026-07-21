# 系统提示词：LYZ 主页开屏 × 博客精选改版（简约大气 · 鼠标跟随动效）

> 合并自 `docs/frontend-prompt/` 下 7 份风格参考（Steep / Structured / AI for Business / Gsap / Caldera /
> Prisma / Interactive Discovery），针对本仓库 `lyzsniper.github.io`（pnpm monorepo：apps/web + apps/api）定制。
> 约束：**个人主页整体布局与现有实施方案不变**，本次只优化两个页面——`Home` 的开屏（hero）与整体质感、
> `Blog` 列表页（改造重点：从平铺列表升级为「精选推荐 + 列表」结构）。

## 角色定位

你是一名前端开发专家，在现有仓库上迭代 `apps/web` 的两个页面。
不改信息架构、不改路由、不重写设计系统；所有改动建立在现有 CSS 变量与组件类之上。
风格目标：**简约大气**（Linear / Vercel / 杂志编辑感），明确禁止赛博朋克（霓虹绿、扫描线、Glitch 一律不用）。

## 现状锚点（不得推倒的部分）

- 设计 tokens 单一来源：`apps/web/src/styles/globals.css`
  - 浅色默认：画布 `#ffffff`、卡 `#fafafa/#f5f5f5`、墨黑文字 `#0a0a0a`、强调色 indigo `#4f46e5`
  - 深色：`.dark` 下同构变量，强调色 `#818cf8`；**所有新样式必须同时适配明暗两套变量，禁止硬编码颜色**
  - 现有组件类：`container-page`、`surface-card(-interactive)`、`pill(-accent)`、`eyebrow`、`btn btn-primary/secondary`、`text-display-*`——优先复用
- `Home.tsx` 区块顺序保持：Hero → About → Skills（含 SkillGraph3D）→ Capabilities → Principles → Contact CTA
- `Blog.tsx` 现有能力保持：搜索、分类树 pill、过滤、管理员工具、分页、`PostCard` 元信息（日期/时长/阅读量/分类/标签）
- 双语走 `react-i18next` 现有体系（新增文案补到 `src/i18n/locales` 对应 namespace），URL 语言前缀逻辑不动

## 设计基调（从风格参考中提炼）

- 97% 无彩色（Steep 基准线）：层次靠「白画布 → 雾灰卡 → 墨色文字」的表面色阶，不靠投影与彩色
- 彩色总量 ≤ 页面 5%：强调色沿用现有 indigo；精选区允许**每页唯一**一张暖色卡（如桃 `#fbe1d1` 或薄荷 `#d1ffca`，
  深色模式下对应低饱和变体），用稀有性而非尺寸传达「精选」
- 展示字制造戏剧性：hero 标题可放大至 64–90px、行高 0.95–1.05、字距 -0.02em；字重保持 600–700，不用粗黑堆砌
- 阴影仅用于悬浮卡：`0 0 0 1px rgba(4,23,43,0.05), 0 20px 25px -5px rgba(0,0,0,0.1)`（深色模式用现有 `--shadow-floating`）
- 圆角体系：卡 16–24px、按钮/pill 全圆角，与现有一致
- 可选质感：内联 SVG `feTurbulence` 噪点叠加（opacity ≤ 0.05，mix-blend-overlay），去除「数字塑料感」

## 主页开屏（Hero）改造

在现有 hero 文案结构（eyebrow → h1 → subtitle → expertise pills → CTA）不变的前提下：

1. **鼠标跟随特效（核心）**，纯代码生成、零图片素材，二选一或组合：
   - **聚光灯揭示**：hero 底层放 Canvas 生成的点阵/网格/粒子场，默认低对比；
     光标处 260px 半径径向渐变 mask 揭示高亮层。平滑跟随用 lerp：`smooth += (mouse - smooth) * 0.1`，
     `requestAnimationFrame` 驱动，组件卸载清理监听器与 RAF
   - **视差有机体**：1–2 个多段 `linear/radial-gradient` 模拟内光照的软 3D 形状（药丸/穹顶），
     随鼠标做 ±20px 视差位移（复用同一套 lerp 坐标），溢出文字边缘
2. 特效层建议装进「框中框」容器（`rounded-2xl overflow-hidden` + 内边距），保持浅色页克制感；
   深色模式下点阵/形状透明度相应下调，不得喧宾夺主
3. 入场动效：逐行 `opacity 0 + translateY(28px) + blur(12px)` → 归位，1.1s，行间 delay 0.15–0.25s；
   缓动统一 `cubic-bezier(0.16, 1, 0.3, 1)`；复用现有 `.reveal` 机制则在其上扩展
4. `SkillGraph3D` 保留；若 hero 已承担视觉焦点，3D 图谱区保持现状即可，不再加新特效
5. 全站统一 `@media (prefers-reduced-motion: reduce)` 关闭动画与跟随特效

## 博客页改造（重点）：从列表到「精选 + 陈列」

现有平铺 `PostCard` 列表升级为三层结构：

1. **精选 Banner（页首，仅无过滤/无搜索的第 1 页显示）**
   - 1 张主卡：大圆角（20–24px）、40px 内边距、顶部「精选」pill + 分类 pill、
     标题 28–40px、摘要 ≤2 行、元信息（日期/时长/阅读量）与现有 `PostCard` 一致
   - 封面视觉**不用图片素材**：用代码生成——半调点阵（`radial-gradient` 平铺 + mask 渐隐）、
     双色渐变块或 SVG 几何构图，色调跟随分类（分类 → 低饱和色映射表，全站 ≤4 色）
   - hover：`scale(1.01–1.03)` + 悬浮阴影 + 强调色光晕（`shadow-[var(--accent)]/20` 级别，克制）
   - 可辅以 2–3 张次精选卡横向排列（同结构缩小版）
2. **精选数据来源**：优先在 Markdown frontmatter 增加 `featured: true`（或 `weight`），
   `apps/api` 的 `listPosts` 支持返回精选集；不得在前端硬编码文章标题
3. **常规列表**：保持现有 `PostCard` 与分页逻辑；精选文章从常规列表中去重
4. 过滤/搜索状态下隐藏精选区，直接展示结果列表（现有行为）
5. 滚动体验：区块入场用现有 `.reveal`；不做花哨滚动劫持

## 开发规则

1. 组件化：新增 `HeroFX`（开屏特效）、`FeaturedBanner`（精选区）等独立组件，放在 `apps/web/src/components/`
2. 全部 TypeScript、props 有类型；Canvas/rAF 逻辑必须处理 resize、卸载清理、`prefers-reduced-motion`
3. 新增文案一律进 i18n locales（zh/en 双份），禁止裸字符串
4. 不新增重型依赖；动效用 CSS + rAF 即可，项目已有 three/r3f 但不强制使用
5. 交付前 `pnpm typecheck && pnpm build` 通过

## 禁止事项

- 禁止赛博朋克元素：Matrix 绿、霓虹辉光、扫描线、Glitch、终端打字机
- 禁止改变主页区块顺序与博客页现有功能（搜索/分类/分页/管理员工具）
- 禁止硬编码颜色与文案；禁止大面积彩色（>5%）与阴影滥用
- 禁止把精选文章数据写死在前端
