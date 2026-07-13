# 37 天 GitHub AI 趋势全景：从造模型到建生态

> 作者：@Jensenlyz / @AI前沿量子港
> 时间窗口：2026-06-01 至 2026-07-07
> 数据源：37 期 GitHub Trending 日榜精选

37 天，190+ 个项目。这是我把过去在做小红书分享的时候，根据这批日常分享放在一起回看后写下的一份总结。

---

## 一、这 37 天发生了什么

我得先说一个限定：这 37 天里我看到的所有项目，都是 GitHub Trending 日榜的"前 5 名"——也就是说，**它们只是"那个时间点 GitHub 上被推荐得最多的项目"**，并不是当时 AI 工具世界的全部面貌。

一个项目今天上了 Trending，可能是真的"代表了某个新方向"，也可能是早就存在、只是刚好被推荐算法捞起来了。**把 37 天的 Trending 当作"AI 演进的信号"是一种过度解读。** 我写这篇博客时也是事后才意识到这一点。所以下面所有的"6 月初/中/下旬""7 月初"——它们都是"我整理日报时的时间顺序"，**不是 AI 行业真实的演进节奏**。

更准确的说法是这样：我按照整理时间，把 37 天里值得聊的项目**按日期分个堆**。每个堆里挑几个有代表性的聊聊。这种归类反映的是"我整理时的视角"，而不是"AI 行业那段时期真的在发生什么"。

6 月初整理的批次里有 `MoneyPrinterTurbo`、`microsoft/markitdown`、`claude-code`。

6 月中段整理的批次里出现了 `hermes-agent`、`last30days-skill`、`Agent-Reach`、`CopilotKit`。

6 月下旬整理的批次里挑了 `cognee`、`palmier-pro`、`openpilot`、`gstack`、`deer-flow`。

7 月初整理的批次里有 `codex-plugin-cc`、`chrome-devtools-mcp`、`LangFlow`、`agentskills`、`page-agent`、`firecrawl`、`zvec`。

**重要前提说完了**，下面才进入正文。**注意：后面章节中所有"6 月初的 Agent 项目多是框架""7 月初再往前走一步"这类说法，都是"我整理时的视角"而非"行业演进"。**

一句话收尾（这是观察样本后我的主观判断，不是客观结论）：

> 37 天的 Trending 样本里，AI 开源项目的重点从"小工具"转向了"生态型项目"——但这只是 GitHub Trending 推荐算法的偏好变化，不能直接等同于整个行业的演进。

## 二、Agent 从框架走向操作系统

第 1 批里出现的 Agent 项目多是框架类（langchain/autogpt 这种），开发者要自己拼 Chain、自己接工具。

第 2 批里开始出现带 Runtime 的 Agent。deer-flow 2.0 是这一类里我最关注的。字节官方出品，72.6k Star，定位 Super Agent Harness。它不再让你拼装，而是把 Gateway、Harness、Sandbox 三层都搭好，文件、记忆、技能、子 Agent、可观测性、IM 通道全内置。

第 3 批里 obra/superpowers 用 14 个 Skill 改造 11 个 Agent 平台，把资深工程师的工程纪律打包成可被自动触发的 Markdown 模块。

更关键的是 MCP（Model Context Protocol）正在变成事实标准。37 天里围绕 MCP 冒出来一连串项目：

- `chrome-devtools-mcp`，Chrome 官方，把浏览器交给 Agent
- `codebase-memory-mcp`，把代码库索引成 Agent 知识图谱
- `aws/agent-toolkit-for-aws`，云厂商官方接入
- `agent-toolkit-for-aws`，企业级 MCP server

6 月 29 日 codebase-memory-mcp 单日 +2,190 Star。AI 不再读完就忘，是真的有长期记忆了。

---

## 三、Skills 成为新基建

37 天里出现了一个值得单独写一章的现象，Skills 范式。

七个核心项目放在一起看：

| 项目 | 定位 | 关键点 |
|------|------|--------|
| `addyosmani/agent-skills` | Google Chrome 负责人出品的生产级范本 | 70k+ Star，TDD/Code Review/Refactor |
| `obra/superpowers` | 14 个 Skill 组成的工程操作系统 | Subagent-Driven Development，11 平台通用 |
| `Matt Pocock/skills` | 教学型 Skill 集合 | 22 个 Skill，单一 harness |
| `agentskills/agentskills` | SKILL.md 格式规范 | 像 OpenAPI 之于 API |
| `alirezarezvani/claude-skills` | 337 个 Skills 跨 9 大领域 | 跨平台兼容的技能超市 |
| `phuryn/pm-skills` | 100+ PM Agentic Skills | 产品全生命周期覆盖 |
| `dotnet/skills` | 微软官方的 .NET Skills | 大厂下场做语言专精 Skills |

这就是一个 OpenAPI 时刻。Skills 格式标准化之后，"AI 能做什么"才能像 API 一样被描述、发现、组合、复用。

Skills 跟 prompt 不一样。prompt 是临时的，Skill 是可维护的工程资产。prompt engineering 升维成 skill engineering，这是 2026 年最值得记住的范式转换之一。

最让我有感触的细节是 superpowers 的 HARD-GATE：装上之后你不需要主动调任何命令，skills 在描述匹配时自动加载。开发者从命令输入者变成 spec 签字者、reviewer 裁决者。这个角色重新定位比 Skill 本身更重要。

---

## 四、巨头下场做基建

37 天样本里最明显的现象是：好几家大厂亲自下场做开源项目。

苹果 `apple/container`，Swift 写 macOS 原生容器，轻量 VM 路线，专门优化 Apple Silicon。Docker Desktop 看了会沉默，单日 +3,504 登顶。

谷歌 `google-labs-code/design.md` 是给 AI Agent 看的设计系统说明书，`google/agents-cli` 把 Gemini/Vertex AI 打包成 CLI。

Meta `facebook/astryx` 是内部用了多年的设计系统首次开源，每个组件都暴露语义化 API，"Agent ready" 是核心理念。

微软 `microsoft/markitdown` 14 万 Star 的 Office 转 Markdown 神器，`microsoft/AI-For-Beginners` 12 周 24 课免费入门课。

亚马逊 `aws/agent-toolkit-for-aws`，AWS 官方 MCP server，让 Claude Code 安全管理 EC2/S3/Lambda。

腾讯云 `TencentCloud/CubeSandbox`，Rust 写的 Agent 沙箱，毫秒级启动。

英伟达 `NVIDIA/SkillSpector`，给 Agent 装 360 安全卫士，扫描第三方 skill 里的挖矿脚本和数据泄露。

Google、Meta、Microsoft、Apple、Amazon、NVIDIA 全部下场做 Agent 基础设施。这不是造锤子了，是造工厂。

### 巨头布局速览

```
┌──────────────────────────────────────────────────────────────┐
│                       巨头 Agent 基建布局                       │
├──────────────┬───────────────────────────────────────────────┤
│ Apple        │ container (macOS 原生容器)                     │
│ Google       │ design.md, agents-cli, skills                 │
│ Microsoft    │ markitdown, AI-For-Beginners, dotnet/skills   │
│ Meta         │ astryx (Agent ready 设计系统)                 │
│ Amazon       │ agent-toolkit-for-aws (MCP server)            │
│ NVIDIA       │ SkillSpector, cosmos                          │
│ 腾讯云       │ CubeSandbox (Rust Agent 沙箱)                │
│ 字节跳动     │ deer-flow, UI-TARS-desktop                    │
│ 阿里         │ page-agent, zvec                              │
│ 美团         │ LongCat-2.0 (1.6T MoE)                        │
└──────────────┴───────────────────────────────────────────────┘
```

---

## 五、AI 记忆系统大爆发

整理 37 天日报时，AI 记忆相关项目的密集程度让我意外。

| 项目 | 定位 | 数据 |
|------|------|------|
| `supermemoryai/supermemory` | The Memory API for the AI era | LongMemEval 81.6% 第一 |
| `MemPalace/mempalace` | 基准最优的 AI 记忆系统 | 5.4 万 Star |
| `cognee` | 向量 + 知识图谱双层结构 | 复杂推理准确率 +30% |
| `codebase-memory-mcp` | 代码库的长期记忆 | 158 种语言，亚毫秒查询 |

最关键的概念升级是 cognee。它把 Agent 记忆从工程问题升级为一等公民。

传统 RAG 是文档 → 切片 → 嵌入 → 相似度匹配 → 用完即丢。cognee 是文档 → 实体 + 关系 → 图谱 → 可推理 → 永久演化。

cognee 的 README 里写的是"更接近人类记忆"——这是项目自己的宣传话术，我无法从 37 天 Trending 样本里独立验证这种说法。仅作记录。

---

## 六、AI 视频创作全面平民化

整理 37 天日报时，AI 视频相关项目频繁出现。

全栈产品：`MoneyPrinterTurbo` 8.5 万 Star 一键生成短视频，`palmier-pro` 单日 +1,630 登顶的 AI 原生视频编辑器，`OpenMontage` 全球首个开源 Agentic 视频生产系统 12 条流水线 500+ 技能。

底层引擎：`hyperframes`，HeyGen 出品，HTML 直接渲染成视频，专为 Agent 设计。

工具链：`video-use` 是 browser-use 团队新作，代码 Agent 剪视频，`Anil-matcha/Open-Generative-AI` 200+ 模型一站收。

hyperframes 的 slogan 是 "Write HTML. Render video. Built for agents."——这是项目方自己的市场定位宣传，我无法从 Trending 数据本身验证这种说法。仅作记录。

---

## 七、国产开源力量的集体登场

整理 37 天日报时，国产 AI 开源项目出现得相当密集。

基础模型这边，`meituan-longcat/LongCat-2.0` 万亿参数 MoE，5 万国产 NPU 训练。`OpenBMB/VoxCPM` 清华和面壁的 TTS，Tokenizer-Free 路线。

Agent 与应用：`bytedance/deer-flow` 72.6k Star 的 Super Agent Harness，`bytedance/UI-TARS-desktop` 多模态 AI Agent 桌面端，`alibaba/page-agent` 浏览器内 GUI Agent，`alibaba/zvec` 进程内向量数据库 7 种索引 9 种量化，`TencentCloud/CubeSandbox` Rust 沙箱。

数据与工具：`PaddlePaddle/PaddleOCR` 80.9k Star 老牌 OCR 重定位为 AI 文档入口，`opendataloader-project/opendataloader-pdf` 和 `opendatalab/MinerU` 都是复杂 PDF 解析的事实标准，`HKUDS/Vibe-Trading` 港大实验室的 AI 交易 Agent，`alchaincyf/zhangxuefeng-skill` 把高考志愿方法论 skill 化。

最让我意外的是 `meituan-longcat/LongCat-2.0`。5 万张国产 NPU 卡集群训练，稳态日吞吐 1T+ tokens/day。匿名接入 OpenRouter 盲测总调用量全球 Top 3（Owl Alpha）。SWE-bench Pro 59.5，超过 Gemini 3.1 Pro (54.2) 和 GPT-5.5 (58.6)。

在 H100/B200 出口管制的背景下，LongCat-2.0 项目方宣称他们的训练证明：不用最顶尖 GPU 也能训出全球第一梯队的模型。这是项目方对自家工作的评价，不是 Trending 样本能独立验证的事实。

### 国产开源热度榜（部分）

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <style>
    .bar { fill: #ff6b35; }
    .label { font-size: 11px; fill: #e6edf3; }
    .value { font-size: 11px; fill: #79c0ff; font-weight: 600; }
    .title { font-size: 14px; fill: #e6edf3; font-weight: 600; }
    .sub { font-size: 10px; fill: #8b949e; }
  </style>
  <rect width="600" height="360" fill="#0d1117"/>
  <text x="20" y="22" class="title">国产 AI 开源项目 GitHub Star 对比（千）</text>
  <text x="20" y="38" class="sub">数据截至 2026-07-07</text>

  <g transform="translate(170,55)">
    <text x="-160" y="13" class="label">PaddlePaddle/PaddleOCR</text>
    <rect class="bar" x="0" y="2" width="323" height="14" rx="2"/>
    <text x="330" y="13" class="value">80.9k</text>
  </g>
  <g transform="translate(170,75)">
    <text x="-160" y="13" class="label">bytedance/deer-flow</text>
    <rect class="bar" x="0" y="2" width="290" height="14" rx="2"/>
    <text x="297" y="13" class="value">72.6k</text>
  </g>
  <g transform="translate(170,95)">
    <text x="-160" y="13" class="label">opendatalab/MinerU</text>
    <rect class="bar" x="0" y="2" width="286" height="14" rx="2"/>
    <text x="293" y="13" class="value">71.6k</text>
  </g>
  <g transform="translate(170,115)">
    <text x="-160" y="13" class="label">bytedance/UI-TARS-desktop</text>
    <rect class="bar" x="0" y="2" width="147" height="14" rx="2"/>
    <text x="154" y="13" class="value">36.7k</text>
  </g>
  <g transform="translate(170,135)">
    <text x="-160" y="13" class="label">OpenBMB/VoxCPM</text>
    <rect class="bar" x="0" y="2" width="120" height="14" rx="2"/>
    <text x="127" y="13" class="value">30k</text>
  </g>
  <g transform="translate(170,155)">
    <text x="-160" y="13" class="label">alibaba/page-agent</text>
    <rect class="bar" x="0" y="2" width="96" height="14" rx="2"/>
    <text x="103" y="13" class="value">24k</text>
  </g>
  <g transform="translate(170,175)">
    <text x="-160" y="13" class="label">HKUDS/Vibe-Trading</text>
    <rect class="bar" x="0" y="2" width="60" height="14" rx="2"/>
    <text x="67" y="13" class="value">15k</text>
  </g>
  <g transform="translate(170,195)">
    <text x="-160" y="13" class="label">alibaba/zvec</text>
    <rect class="bar" x="0" y="2" width="54" height="14" rx="2"/>
    <text x="61" y="13" class="value">13.5k</text>
  </g>
  <g transform="translate(170,215)">
    <text x="-160" y="13" class="label">TencentCloud/CubeSandbox</text>
    <rect class="bar" x="0" y="2" width="27" height="14" rx="2"/>
    <text x="34" y="13" class="value">6.8k</text>
  </g>

  <text x="170" y="265" class="title">🇨🇳 LongCat-2.0：参数规模 1.6T</text>
  <text x="170" y="283" class="sub">5 万张国产 NPU 训练 / SWE-bench Pro 59.5 / OpenRouter 盲测全球 Top 3</text>

  <text x="20" y="320" class="sub">↗ 趋势：模型 + Agent + 数据 三层同时开花</text>
  <text x="20" y="338" class="sub">↗ 我的观察：从"跟随"走向"原创架构"</text>
</svg>

---

## 八、AI 安全走向基础设施

整理 37 天日报时，AI 安全相关项目出现得相当密集。

专门做 AI Agent 安全的：`NVIDIA/SkillSpector` 是 Agent 技能安全扫描器，`mukul975/Anthropic-Cybersecurity-Skills` 817 个网安技能覆盖 6 大框架。

AI 渗透测试：`usestrix/strix` 28k Star 老牌项目模拟真实攻击链，`Unclecheng-li/VulnClaw` MCP 协议 + Agent 实现全自动渗透。

数据安全与合规：AWS 官方 MCP server 自带 IAM 权限边界，deer-flow 默认仅 127.0.0.1 loopback 部署。

随着 AI Agent 能做的事情越来越多，谁来审计 Agent 就成了新刚需。安全工具从人审人变成 Agent 审 Agent。

---

## 九、五个容易被忽视的支线

**嵌入式 AI 基建。** `alibaba/zvec`（C++ 进程内向量库）、`tursodatabase/turso`（进程内 SQL）、`ruvnet/RuView`（WiFi 信号变空间雷达）这三个项目指向同一件事：AI 基座从云端拉回桌面。Chroma 太慢、Milvus 太重、Qdrant 还要起服务。zvec 走的是像 SQLite 一样把数据库嵌进应用的路子，启动毫秒级、搜索亚毫秒级。这给单机 AI 应用、小工具、边缘部署打开了新世界。

**设计系统被 AI 化。** `pbakaus/impeccable`（AI coding agent 专用设计语言）、`google-labs-code/design.md`、`facebook/astryx`。三件事一起说：AI 不懂设计 → 现在有规范让它懂 → 大厂把设计系统也升级为 AI 友好。

**知识管理回归本地。** `tolaria` 桌面 Markdown 知识库，`mauriceboe/TREK` 自托管旅行规划，`ripienaar/free-for-dev` 12.4 万 Star 的免费 SaaS 清单。SaaS 越来越贵、订阅制越来越被诟病的今天，本地可控、数据主权正在成为新刚需。

**跨平台研究 Agent 走通。** `mvanhorn/last30days-skill` 横扫 Reddit/X/YouTube/HN/Polymarket/Web 六大平台，37 天内多次登顶，单日最高 +3,191。`Panniantong/Agent-Reach` Twitter/Reddit/YouTube/B站/小红书 6 平台零 API 成本。`firecrawl/firecrawl` 146k Star 的 AI 爬虫事实标准。研究者 + 调研者这个画像突然被 AI 完整覆盖。信息过载时代最稀缺的是能替你读懂信息的人。

**物理世界 + 具身智能。** `NVIDIA/cosmos` 物理 AI 世界模型，`Robbyant/lingbot-map` 前馈式 3D 重建，`commaai/openpilot` 62k Star 自称机器人 OS，`MIT-SPARK/Intro-to-Autonomous-Robots` 教材级开源。物理 AI 还没爆发，但基础设施层已经动起来了。

---

## 十、七个值得记住的时刻

把 37 天浓缩成 7 个关键时刻：

**6.01** `microsoft/markitdown` 单日 +2,798。Markdown 成为 AI 时代的通用语。

**6.04** `NousResearch/hermes-agent` 18 万 Star。Agent 从工具变成伙伴，grows with you 成为新叙事。

**6.08** `RyanCodrai/turbovec` 单日 +1,554。向量数据库开始分化，轻量、嵌入式、Rust 原生是新方向。

**6.13** `apple/container` 单日 +3,504。Apple Silicon 时代，Docker 套壳不再是答案。

**6.22** `topoteretes/cognee` 发布。RAG 被升维，从匹配到推理，知识图谱成为 Agent 的一等公民。

**6.23** `garrytan/gstack` 单日 +573。YC 掌门人把自家 Claude Code 配置开源，AI 工作流是创业公司级资产。

**7.03** `openai/codex-plugin-cc` 上榜 +352。OpenAI 官方做插件让 Codex 跑进 Claude Code，Agent 联邦时代正式开启。

---

## 十一、给做 AI 产品的几个判断

不要再造一个 Agent 框架了。MCP 协议已经被 Chrome、AWS、OpenAI 集体背书。Skills 范式有了 SKILL.md 规范。下一步是在标准上构建，不是再造轮子。

Skills 在 37 天样本里出现频次很高——这本身是个事实。Matt Pocock、Addy Osmani、Jesse Vincent、agentskills 组织、微软、Google 都出现在样本里。**至于**"Skills 是不是 2026 下半年最大的产品形态"，**这是我的预测**，不是从样本本身能推出的结论。

知识图谱会重新成为显学。cognee、MemPalace、codebase-memory-mcp 三件事一起说，当匹配已经不够用，AI 行业会回到知识图谱。

Coding Agent 的终极战场是工作流。Claude Code、Cursor、Codex、gstack、superpowers、Matt Pocock skills、agent-skills，所有玩家都在争夺开发者每天的工作流。

嵌入式 AI 基建被严重低估。zvec、turso、RuView、superpowers 零依赖、cognee 嵌入式图库，AI 基座从云端拉回桌面是确定趋势。

从 37 天 Trending 样本看，国产开源项目出现得相当密集（VoxCPM、deer-flow、page-agent、zvec、LongCat-2.0 等）。**说"已经从跟随走向原创"是我的主观判断**，我无法从 Trending 样本里独立证明。

---

## 十二、2026 下半年我赌的几件事

Q3：MCP 会成为 Agent 连接外部工具的事实标准，90% 的新 Agent 框架默认支持。Skills 市场会爆发，类比 2008 年 App Store。嵌入式 AI 基建的更多项目会冒出来。

Q4：Coding Agent 会出现第一个百万 DAU 的产品。知识图谱 + LLM 的组合会有更深入的论文和工具。中国开源会在原创架构上持续输出。

我承认这些预测大概率是错的。**重要的是要记得：37 天的 Trending 样本不能证明任何关于"AI 行业整体走向"的事**——样本里看到的趋势，可能只是 Trending 推荐算法的偏好变化。

---

## 写在最后

37 天前我写日报时还在想"今天哪个项目会爆"，37 天后我意识到我可能问错了问题。

把 37 天的样本综合起来看，**我个人的解读是**：Skills 标准化、MCP 协议化、Agent 平台化、记忆图谱化这些信号加在一起，**可能**意味着 AI 行业的价值正在从模型层转向生态层。但这**只是我对样本的解读**，不是 Trending 能直接证明的事实。

下一个爆款**可能**是：一个杀手级 Skill、一个杀手级 MCP server、一个杀手级 Agent 工作流——**这是我的猜测**。模型会越来越像水电，差异化在应用层——**这也是我的观察，不是结论**。

**说这些只是为了把样本里看到的东西串成一条故事**。说"2026 年是 AI 应用层创业的黄金窗口"——这是个人观点，**不是从 Trending 数据里能推出的事实**。

---

## 附录 A：37 天涉及项目完整索引

> 以下按 11 个赛道分类整理，所有链接均为 GitHub 官方仓库。

### A1 · AI Agent 框架

| 项目 | 简介 | 链接 |
|------|------|------|
| NousResearch/hermes-agent | "与你一起成长"的 Agent 框架，18 万 Star | [github.com/NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) |
| bytedance/deer-flow | 字节出品 Super Agent Harness，72.6k Star | [github.com/bytedance/deer-flow](https://github.com/bytedance/deer-flow) |
| langflow-ai/langflow | LangChain 生态低代码 Agent 平台，150k Star | [github.com/langflow-ai/langflow](https://github.com/langflow-ai/langflow) |
| bytedance/UI-TARS-desktop | 字节多模态 AI Agent 桌面端 | [github.com/bytedance/UI-TARS-desktop](https://github.com/bytedance/UI-TARS-desktop) |
| aaif-goose/goose | Block 出品的开源 AI Agent，Rust 实现 | [github.com/aaif-goose/goose](https://github.com/aaif-goose/goose) |
| stablyai/orca | 并行 Agent 调度器（ADE） | [github.com/stablyai/orca](https://github.com/stablyai/orca) |
| gastownhall/gastown | 多 Agent 工作空间管理器 | [github.com/gastownhall/gastown](https://github.com/gastownhall/gastown) |
| anthropics/claude-code | Anthropic 终端 AI 编码助手 | [github.com/anthropics/claude-code](https://github.com/anthropics/claude-code) |
| TauricResearch/TradingAgents | 多 Agent 协作量化交易框架 | [github.com/TauricResearch/TradingAgents](https://github.com/TauricResearch/TradingAgents) |
| revfactory/harness | Meta-skill 自动设计 AI Agent 团队 | [github.com/revfactory/harness](https://github.com/revfactory/harness) |

### A2 · Skills 生态

| 项目 | 简介 | 链接 |
|------|------|------|
| addyosmani/agent-skills | Google Chrome 负责人出品的生产级 Skills 范本 | [github.com/addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) |
| obra/superpowers | 14 个 Skill 组成的工程操作系统 | [github.com/obra/superpowers](https://github.com/obra/superpowers) |
| mattpocock/skills | TypeScript 大神 Matt Pocock 的 22 个 Skill | [github.com/mattpocock/skills](https://github.com/mattpocock/skills) |
| agentskills/agentskills | SKILL.md 格式规范，21.6k Star | [github.com/agentskills/agentskills](https://github.com/agentskills/agentskills) |
| alirezarezvani/claude-skills | 337 个 Skills 跨 9 大领域 | [github.com/alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) |
| phuryn/pm-skills | 100+ PM Agentic Skills 全生命周期 | [github.com/phuryn/pm-skills](https://github.com/phuryn/pm-skills) |
| dotnet/skills | 微软官方的 .NET Agent Skills | [github.com/dotnet/skills](https://github.com/dotnet/skills) |
| alchaincyf/zhangxuefeng-skill | 张雪峰高考志愿方法论 skill 化 | [github.com/alchaincyf/zhangxuefeng-skill](https://github.com/alchaincyf/zhangxuefeng-skill) |
| google/skills | Google 官方 Agent Skills 集合 | [github.com/google/skills](https://github.com/google/skills) |
| mukul975/Anthropic-Cybersecurity-Skills | 817 个网安技能覆盖 6 大框架 | [github.com/mukul975/Anthropic-Cybersecurity-Skills](https://github.com/mukul975/Anthropic-Cybersecurity-Skills) |

### A3 · AI 记忆与知识图谱

| 项目 | 简介 | 链接 |
|------|------|------|
| supermemoryai/supermemory | The Memory API for the AI era | [github.com/supermemoryai/supermemory](https://github.com/supermemoryai/supermemory) |
| MemPalace/mempalace | 基准最优的 AI 记忆系统 | [github.com/MemPalace/mempalace](https://github.com/MemPalace/mempalace) |
| topoteretes/cognee | 向量 + 知识图谱双层记忆引擎 | [github.com/topoteretes/cognee](https://github.com/topoteretes/cognee) |
| DeusData/codebase-memory-mcp | 代码库长期记忆 MCP server | [github.com/DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp) |
| chopratejas/headroom | Agent 上下文压缩层，Token 省 60-95% | [github.com/chopratejas/headroom](https://github.com/chopratejas/headroom) |

### A4 · 向量数据库与 RAG 基建

| 项目 | 简介 | 链接 |
|------|------|------|
| RyanCodrai/turbovec | Rust 写的超快向量索引引擎 | [github.com/RyanCodrai/turbovec](https://github.com/RyanCodrai/turbovec) |
| alibaba/zvec | 阿里进程内向量数据库，7 索引 9 量化 | [github.com/alibaba/zvec](https://github.com/alibaba/zvec) |
| tursodatabase/turso | 进程内 SQL 数据库，SQLite 兼容 | [github.com/tursodatabase/turso](https://github.com/tursodatabase/turso) |
| LMCache/LMCache | LLM 推理 KV 缓存层 | [github.com/LMCache/LMCache](https://github.com/LMCache/LMCache) |
| D4Vinci/Scrapling | Python 爬虫新标杆，反爬绕过+自适应 | [github.com/D4Vinci/Scrapling](https://github.com/D4Vinci/Scrapling) |
| firecrawl/firecrawl | AI 爬虫事实标准，146k Star | [github.com/firecrawl/firecrawl](https://github.com/firecrawl/firecrawl) |

### A5 · 浏览器 / GUI / Web Agent

| 项目 | 简介 | 链接 |
|------|------|------|
| Panniantong/Agent-Reach | 零 API 费用全网搜索 Agent | [github.com/Panniantong/Agent-Reach](https://github.com/Panniantong/Agent-Reach) |
| alibaba/page-agent | 阿里 GUI Agent，自然语言操控网页 | [github.com/alibaba/page-agent](https://github.com/alibaba/page-agent) |
| CopilotKit/CopilotKit | Agent 前端框架，AG-UI 协议制定者 | [github.com/CopilotKit/CopilotKit](https://github.com/CopilotKit/CopilotKit) |
| ChromeDevTools/chrome-devtools-mcp | Chrome 官方 MCP Server，45k Star | [github.com/ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) |
| mvanhorn/last30days-skill | 跨 6 平台研究 Agent | [github.com/mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill) |
| JCodesMore/ai-website-cloner-template | 一行命令克隆任意网站 | [github.com/JCodesMore/ai-website-cloner-template](https://github.com/JCodesMore/ai-website-cloner-template) |
| pbakaus/impeccable | AI coding agent 专用设计语言 | [github.com/pbakaus/impeccable](https://github.com/pbakaus/impeccable) |
| openai/codex-plugin-cc | OpenAI 官方 Claude Code 插件 | [github.com/openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc) |
| google-labs-code/design.md | Google Labs 给 AI Agent 看的设计系统 | [github.com/google-labs-code/design.md](https://github.com/google-labs-code/design.md) |
| facebook/astryx | Meta 内部设计系统，Agent ready | [github.com/facebook/astryx](https://github.com/facebook/astryx) |
| EveryInc/compound-engineering-plugin | Claude Code / Cursor 多 Agent 协作插件 | [github.com/EveryInc/compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin) |

### A6 · AI 视频 / AIGC

| 项目 | 简介 | 链接 |
|------|------|------|
| harry0703/MoneyPrinterTurbo | 一键生成短视频，8.5 万 Star | [github.com/harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) |
| calesthio/OpenMontage | 全球首个开源 Agentic 视频生产系统 | [github.com/calesthio/OpenMontage](https://github.com/calesthio/OpenMontage) |
| heygen-com/hyperframes | HeyGen 出品，HTML 渲染视频 | [github.com/heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) |
| Anil-matcha/Open-Generative-AI | 200+ 模型一站收的开源 AIGC 工坊 | [github.com/Anil-matcha/Open-Generative-AI](https://github.com/Anil-matcha/Open-Generative-AI) |
| hugohe3/ppt-master | AI 文档转可编辑 PPT | [github.com/hugohe3/ppt-master](https://github.com/hugohe3/ppt-master) |
| affaan-m/ECC | 给 AI 编码助手装操作系统的技能框架 | [github.com/affaan-m/ECC](https://github.com/affaan-m/ECC) |

### A7 · 文档 / OCR / PDF / 数据预处理

| 项目 | 简介 | 链接 |
|------|------|------|
| microsoft/markitdown | 微软 Office 转 Markdown 神器，142k Star | [github.com/microsoft/markitdown](https://github.com/microsoft/markitdown) |
| PaddlePaddle/PaddleOCR | 百度 OCR 王者，80.9k Star | [github.com/PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) |
| opendataloader-project/opendataloader-pdf | PDF 解析成 AI-ready 结构化数据 | [github.com/opendataloader-project/opendataloader-pdf](https://github.com/opendataloader-project/opendataloader-pdf) |
| opendatalab/MinerU | 企业级复杂 PDF → LLM-ready 解析 | [github.com/opendatalab/MinerU](https://github.com/opendatalab/MinerU) |
| allenai/olmocr | AllenAI 的 PDF 线性化工具 | [github.com/allenai/olmocr](https://github.com/allenai/olmocr) |
| Stirling-Tools/Stirling-PDF | GitHub #1 PDF 工具箱，83k Star | [github.com/Stirling-Tools/Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF) |
| google-research/timesfm | Google 时序预测基础模型 | [github.com/google-research/timesfm](https://github.com/google-research/timesfm) |

### A8 · 语音 / 多模态 / 视觉

| 项目 | 简介 | 链接 |
|------|------|------|
| OpenBMB/VoxCPM | 清华 & 面壁 TTS，Tokenizer-Free | [github.com/OpenBMB/VoxCPM](https://github.com/OpenBMB/VoxCPM) |
| Open-LLM-VTuber/Open-LLM-VTuber | 本地 LLM + Live2D 虚拟主播 | [github.com/Open-LLM-VTuber/Open-LLM-VTuber](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber) |
| roboflow/supervision | CV 工具库，46k Star | [github.com/roboflow/supervision](https://github.com/roboflow/supervision) |
| hasaneyldrm/exercises-dataset | 433 个健身动作的 AI 数据集 | [github.com/hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) |

### A9 · 量化 / 金融 / 决策

| 项目 | 简介 | 链接 |
|------|------|------|
| shiyu-coder/Kronos | 金融专用 Foundation Model，30k Star | [github.com/shiyu-coder/Kronos](https://github.com/shiyu-coder/Kronos) |
| stefan-jansen/machine-learning-for-trading | 量化 ML 150+ Notebook 全集 | [github.com/stefan-jansen/machine-learning-for-trading](https://github.com/stefan-jansen/machine-learning-for-trading) |
| xbtlin/ai-berkshire | 巴菲特芒格段永平李录四大师 AI 投研 | [github.com/xbtlin/ai-berkshire](https://github.com/xbtlin/ai-berkshire) |
| HKUDS/Vibe-Trading | 港大 HKUDS 出品个人 AI 交易 Agent | [github.com/HKUDS/Vibe-Trading](https://github.com/HKUDS/Vibe-Trading) |
| Andyyyy64/whichllm | 一条命令测出你的硬件能跑哪个 LLM | [github.com/Andyyyy64/whichllm](https://github.com/Andyyyy64/whichllm) |

### A10 · 基建 / 工具 / 自托管

| 项目 | 简介 | 链接 |
|------|------|------|
| apple/container | Apple 官方 macOS 容器，Swift 原生 | [github.com/apple/container](https://github.com/apple/container) |
| TencentCloud/CubeSandbox | 腾讯云 Rust 写的 Agent 沙箱 | [github.com/TencentCloud/CubeSandbox](https://github.com/TencentCloud/CubeSandbox) |
| aws/agent-toolkit-for-aws | AWS 官方 Agent MCP server | [github.com/aws/agent-toolkit-for-aws](https://github.com/aws/agent-toolkit-for-aws) |
| microsoft/AI-For-Beginners | 微软 12 周 24 课 AI 入门课 | [github.com/microsoft/AI-For-Beginners](https://github.com/microsoft/AI-For-Beginners) |
| ripienaar/free-for-dev | 12.4 万 Star 免费 SaaS 清单 | [github.com/ripienaar/free-for-dev](https://github.com/ripienaar/free-for-dev) |
| IceWhaleTech/CasaOS | 开源个人云系统 NAS | [github.com/IceWhaleTech/CasaOS](https://github.com/IceWhaleTech/CasaOS) |
| harvard-edge/cs249r_book | 哈佛 ML 系统工程教材 | [github.com/harvard-edge/cs249r_book](https://github.com/harvard-edge/cs249r_book) |
| penpot/penpot | Figma 开源替代，SVG 原生 | [github.com/penpot/penpot](https://github.com/penpot/penpot) |
| CoreBunch/Instatic | 1 分钟部署的自托管 CMS | [github.com/CoreBunch/Instatic](https://github.com/CoreBunch/Instatic) |

### A11 · 物理 AI / 机器人 / 物理感知

| 项目 | 简介 | 链接 |
|------|------|------|
| NVIDIA/cosmos | 英伟达物理 AI 世界模型 | [github.com/NVIDIA/cosmos](https://github.com/NVIDIA/cosmos) |
| Robbyant/lingbot-map | 前馈式 3D 基础模型 | [github.com/Robbyant/lingbot-map](https://github.com/Robbyant/lingbot-map) |
| commaai/openpilot | 62k Star 开源辅助驾驶 / 机器人 OS | [github.com/commaai/openpilot](https://github.com/commaai/openpilot) |
| ruvnet/RuView | WiFi 信号变空间雷达，76k Star | [github.com/ruvnet/RuView](https://github.com/ruvnet/RuView) |
| maziyarpanahi/openmed | 开源医疗 AI | [github.com/maziyarpanahi/openmed](https://github.com/maziyarpanahi/openmed) |
| Introduction-to-Autonomous-Robots/Introduction-to-Autonomous-Robots | MIT/科罗拉多大学自主机器人开源教材 | [github.com/Introduction-to-Autonomous-Robots/Introduction-to-Autonomous-Robots](https://github.com/Introduction-to-Autonomous-Robots/Introduction-to-Autonomous-Robots) |

### A12 · 安全 / 渗透测试

| 项目 | 简介 | 链接 |
|------|------|------|
| NVIDIA/SkillSpector | NVIDIA AI Agent 技能安全扫描器 | [github.com/NVIDIA/SkillSpector](https://github.com/NVIDIA/SkillSpector) |
| usestrix/strix | 28k Star AI 渗透测试老牌项目 | [github.com/usestrix/strix](https://github.com/usestrix/strix) |
| Unclecheng-li/VulnClaw | MCP + Agent 全自动渗透测试 | [github.com/Unclecheng-li/VulnClaw](https://github.com/Unclecheng-li/VulnClaw) |
| Mebus/cupp | 经典社工密码字典生成器 | [github.com/Mebus/cupp](https://github.com/Mebus/cupp) |

### A13 · 知识管理 / 工具类

| 项目 | 简介 | 链接 |
|------|------|------|
| lfnovo/open-notebook | 开源版 NotebookLM | [github.com/lfnovo/open-notebook](https://github.com/lfnovo/open-notebook) |
| refactoringhq/tolaria | 桌面 Markdown 知识库管理器 | [github.com/refactoringhq/tolaria](https://github.com/refactoringhq/tolaria) |
| mauriceboe/TREK | 自托管旅行规划 PWA | [github.com/mauriceboe/TREK](https://github.com/mauriceboe/TREK) |
| kunchenguid/no-mistakes | git push 前自动核查 | [github.com/kunchenguid/no-mistakes](https://github.com/kunchenguid/no-mistakes) |
| rmyndharis/OpenWA | WhatsApp 自托管网关 | [github.com/rmyndharis/OpenWA](https://github.com/rmyndharis/OpenWA) |
| meshery/meshery | 云原生全家桶管理面板 | [github.com/meshery/meshery](https://github.com/meshery/meshery) |
| chatwoot/chatwoot | 开源客服平台，Intercom 替代 | [github.com/chatwoot/chatwoot](https://github.com/chatwoot/chatwoot) |
| iptv-org/iptv | 12 万 Star 全球 IPTV 频道大全 | [github.com/iptv-org/iptv](https://github.com/iptv-org/iptv) |
| puppeteer/puppeteer | 94.7k Star 浏览器自动化经典 | [github.com/puppeteer/puppeteer](https://github.com/puppeteer/puppeteer) |
| affaan-m/everything-claude-code | 长上下文 Claude Code 配置 | [github.com/affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) |

### A14 · 基础模型 / LLM 训练

| 项目 | 简介 | 链接 |
|------|------|------|
| meituan-longcat/LongCat-2.0 | 美团万亿参数 MoE，国产 NPU 训练 | [huggingface.co/meituan-longcat/LongCat-2.0](https://huggingface.co/meituan-longcat/LongCat-2.0) |
| google-deepmind/... | 多个研究模型 | 略 |
| 0eu/stable-code-train-llm | LLM 训练从零教程 | [github.com/0eu/stable-code-train-llm](https://github.com/0eu/stable-code-train-llm) |

---

## 附录 B · 生态层级关系图

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 480" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <style>
    .layer-title { font-size: 13px; font-weight: 700; fill: #e6edf3; }
    .layer-desc { font-size: 11px; fill: #c9d1d9; }
    .layer-hint { font-size: 10px; fill: #8b949e; font-style: italic; }
    .arrow { stroke: #ff6b35; stroke-width: 2; fill: none; }
    .arrow-text { font-size: 11px; fill: #ff6b35; font-weight: 600; }
  </style>
  <rect width="720" height="480" fill="#0d1117"/>

  <!-- 应用层 -->
  <rect x="40" y="20" width="640" height="60" rx="8" fill="#1f6feb" fill-opacity="0.15" stroke="#1f6feb" stroke-width="1.5"/>
  <text x="55" y="42" class="layer-title">L5 · 应用层 (Applications)</text>
  <text x="55" y="62" class="layer-desc">MoneyPrinterTurbo · OpenMontage · hyperframes · palmier-pro · Open-Generative-AI</text>

  <!-- Skill 层 -->
  <rect x="40" y="95" width="640" height="60" rx="8" fill="#a371f7" fill-opacity="0.15" stroke="#a371f7" stroke-width="1.5"/>
  <text x="55" y="117" class="layer-title">L4 · Skill 层 (Agent Skills)</text>
  <text x="55" y="137" class="layer-desc">agent-skills · superpowers · claude-skills · pm-skills · dotnet-skills · Cybersecurity-Skills</text>

  <!-- Agent 框架层 -->
  <rect x="40" y="170" width="640" height="60" rx="8" fill="#3fb950" fill-opacity="0.15" stroke="#3fb950" stroke-width="1.5"/>
  <text x="55" y="192" class="layer-title">L3 · Agent 框架层 (Agent Frameworks)</text>
  <text x="55" y="212" class="layer-desc">deer-flow · LangFlow · hermes-agent · orca · gastown · claude-code · goose · codex-plugin-cc</text>

  <!-- 协议层 -->
  <rect x="40" y="245" width="640" height="60" rx="8" fill="#d29922" fill-opacity="0.15" stroke="#d29922" stroke-width="1.5"/>
  <text x="55" y="267" class="layer-title">L2 · 协议层 (MCP / Skills 标准)</text>
  <text x="55" y="287" class="layer-desc">chrome-devtools-mcp · codebase-memory-mcp · agent-toolkit-for-aws · agentskills</text>

  <!-- 基建层 -->
  <rect x="40" y="320" width="640" height="60" rx="8" fill="#ff6b35" fill-opacity="0.15" stroke="#ff6b35" stroke-width="1.5"/>
  <text x="55" y="342" class="layer-title">L1 · 基建层 (Infrastructure)</text>
  <text x="55" y="362" class="layer-desc">zvec · turso · CubeSandbox · apple/container · cognee · supermemory · turbovec</text>

  <!-- 基础模型层 -->
  <rect x="40" y="395" width="640" height="50" rx="8" fill="#f78166" fill-opacity="0.2" stroke="#f78166" stroke-width="1.5"/>
  <text x="55" y="416" class="layer-title">L0 · 基础模型 (Foundation Models)</text>
  <text x="55" y="434" class="layer-desc">LongCat-2.0 · VoxCPM · TimesFM · Kronos · claude-code · gpt · gemini</text>

  <!-- 价值转移箭头 -->
  <path d="M 690 420 Q 715 420 715 250 Q 715 80 690 60" class="arrow" marker-end="url(#arrowhead)"/>
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
      <polygon points="0 0, 9 3, 0 6" fill="#ff6b35"/>
    </marker>
  </defs>
  <text x="705" y="240" class="arrow-text" transform="rotate(-90 705 240)">价值转移</text>

  <text x="40" y="468" class="layer-hint">↗ 2026 年最重要的判断：差异化机会在 L4 / L5，模型会越来越像水电</text>
</svg>

---

*本文基于 2026-06-01 至 2026-07-07 共 37 期 GitHub Trending 日报精选整理。*
*数据来源：github.com/trending 日榜 + GitHub API。*
*附录项目链接为整理时 GitHub 仓库地址，部分较冷门项目请以实际访问为准。*
