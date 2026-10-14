# 一个token都不生成，它凭什么刷屏

一个 AI，一个汉字都不写，却让 14 万开发者连夜排队试用，让阿里云第 9 天就照抄它的协议，让 Redis 创始人亲自下场开怼。

它叫 Jev，是 TypeSafe 发布的第一个 **System One 模型**——2026 年 9 月刚定义的新物种：不生成文本，只做判断。你给它一段状态、一组带类型的问题，它在一次前向传播里并行返回答案、完整概率分布和置信度。代码拿到结果直接 if-else，没有解析，没有 JSON mode，没有重试。

两周之内，开源复现（Laya、Decider、Bespoke Nimble）、云厂商跟进（阿里云 decision-model-preview）、推理框架支持（Ollama 原生 `/v1/systemone` 端点）全部到位。这节奏，今年真不多见。

这篇深度解析想回答四件事：它到底解决了什么、技术上成不成立、开源方案能不能用、想自己搭该怎么搭。👇

## 一、大模型最贵的浪费：用它做判断

过去几年，AI 的本事全点在"写"上了。可生产系统里每天跑几十亿次的，不是写小作文，而是做判断：工单归谁、日志要不要报警、这个回答靠不靠谱。

拿 LLM 干这个，像请了个特能聊的顾问。你问"这单退不退"，他能从公司政策聊到客户心理，聊完五分钟，你还得从一大段话里猜他到底站哪边。💸

具体错在哪？四层错配：

| 错配 | 具体表现 |
| --- | --- |
| 生成 vs 判断 | 只要一个标签，却要走完整个自回归流程，钱和延迟跟着字数涨 |
| 解析脆性 | prompt 工程 + JSON mode + 重试三件套，照样吐非法结构 |
| 幻觉面 | 模型可能编出选项之外的"创意答案"，下游 schema 直接崩 |
| 概率不可得 | 生成模型的概率拿不到，拿到了也没校准，阈值没法设 |

![LLM 生成路线 vs System One 路线](generate-vs-decide.png)

System One 的解法简单粗暴：**把开放式生成收窄成类型化的答案空间**。可能的输出提前由 schema 枚举好，模型在构造上就不可能越界。一整类幻觉，被结构性消掉了。

这句话的分量，得看出处。TypeSafe CEO Diogo Almeida——OpenAI 早期成员、InstructGPT 论文合著者——把话撂下了：

![Diogo Almeida 发布推文](quote-almeida.png)

"totally useless for computers"（对计算机完全没用）。说得狠，但这就是整个品类的出发点：**文本是给人看的接口，机器要的只是一个能直接执行的答案。**

顺带两个命名梗，挺有味道。System One 借自卡尼曼的"系统一/系统二"；Jev 来自 19 世纪经济学家杰文斯——杰文斯悖论说效率越高、总消耗反而越大。TypeSafe 赌的就是这个：当一次判断便宜到几十毫秒、几美元一百万次，软件对 AI 判断的总调用量会爆炸。📈

## 二、忘掉聊天框，它是一张考卷

理解 System One 最快的方式：把它想成一张结构化考卷——**state 是题面，questions 是题目，模型交回来的是标准答题卡**。一个真实的阿里云工单分流请求：

```json
{
  "model": "decision-model-preview",
  "state": {"ticket_id": "T-1001", "content": "订单支付后超过 24 小时仍未到账……"},
  "questions": {
    "department": {"type": "choice", "instructions": "应该由哪个团队处理？",
                   "criteria": {"billing": "支付、退款和账单问题", "technical": "产品故障和集成问题"}},
    "escalate": {"type": "null", "instructions": "是否需要立即通知值班人员？"},
    "severity": {"type": "score", "instructions": "这个问题有多严重？",
                 "criteria": ["轻微问题，不影响功能", "部分功能受影响", "核心功能不可用", "严重业务或安全影响"]}
  }
}
```

三个问题一次发出、一次前向并行算完，每个都带回答案、概率分布、置信度。后续流程怎么走，代码直接写分支，"解析"这个环节根本不存在。

![System One 决策模型工作流程](jev-system-one-flow.png)

题型一共三种，官方叫 AI primitives：

| 原语 | 干什么 | 返回什么 |
| --- | --- | --- |
| **Choice** | 封闭选项集（最多 255 个）里选一个 | 选中项、每项概率、置信度 |
| **Score** | 有序量表（建议 3–7 级）上评级 | 分数（概率加权期望，可以是 1.43）、等级分布、置信度 |
| **Null** | 判断一个陈述为真的概率 | 0–1 的 P(yes) |

第三个名字容易误会：null 不是"空值"，是从伯努利分布化来的，CEO 在 Hacker News 上亲自确认过。语义就是"是/否，但给概率"。

工程上记三点就够：三种题型可以在一次调用里混着用；每个问题独立评估、互不污染（官方叫避免 context rot）；state 只编码一次，加问题几乎不加延迟。⚡

## 三、底下是两条完全不同的技术路线

注意，System One 定义的是**输出契约**，不是某个实现。底下的路线有两条，差别巨大。

**路线一：专职阅卷老师——双向编码器。** 代表是开源复现 Laya，基座 ModernBERT / mmBERT。BERT 系天生就是干"理解+分类"的，双向注意力一次前向搞定，没有解码。参数 3–4 亿，CPU 都能跑。

我把这个仓库克隆下来翻了一遍，工程密度超预期，必须多说两句。

作者 Nandha Kishor M 不是跟风——2025 年 3 月他就发了 SalesRLAgent 论文（arXiv:2503.23303），10 月又发了置信度路由的论文。Jev 发布后他在 dev.to 写了篇文章，标题相当直白：*"非自回归决策模型我做了一年了，然后一个前沿实验室管这叫'突破'"*。这个案例分析现在仓库 31.8k stars、Apache-2.0，后续的技术圈故事值得单写一篇。

仓库里的 BENCHMARKS.md 每个数字都标了复现方式（固定 seed、byte-identical），还明说 Jev 的数字是第三方公布值、本地没测过——这种坦诚该记一笔。关键几行：

| 指标 | Laya（微调版） | Jev（公布值） |
| --- | --- | --- |
| typed-decisions 基准（2000 决策） | **0.766** | 0.727 |
| AG News（4 分类） | **0.953** | 0.910 |
| 温度拟合后 ECE | **0.081** | 0.246 |
| p50 延迟，单问题（T4） | **32.8 ms** | 236–276 ms |

51 种语言 sweep，多语言检查点在 48 个语言上超 3 倍随机基线——中文场景能打。还有个细节看出作者多严谨：他发现温度参数没 clamp 导致 20 选项问题 ECE 偏高，修复后 51 语言平均 ECE 从 0.7331 降到 0.5709，准确率一位小数没变（温度缩放不改 argmax），然后把修复前后数据全公开了。仓库还配了 verify/ 工具链：权重 sha256 校验、200 次重复调用内存泄漏 soak 测试、CPU vs GPU 数值一致性检查。

生态也齐：五端 SDK（Python/TS/Java/.NET/Go）、41 个递进示例、LangChain/LangGraph/LlamaIndex/CrewAI 集成、MCP server、Docker 多平台镜像。微调闭环现成（Kaggle 免费 2×T4 笔记本）：typed-decisions 微调版 0.766 vs 基础版 0.362——典型的"零样本可用、微调起飞"曲线。🚀

**路线二：让博士生只涂答题卡——decoder 基座 + 答案槽位读出。** 代表是 Decider 和 Bespoke Nimble（基座 Qwen3.5），外界普遍猜 Jev 本体也是这条路。Decider 模型卡原话：*"One readout: the letter logits at an answer slot, softmaxed over the options."* 用 decoder 的语义理解力，但只在答案槽位对候选 token 的 logits 做 softmax，**一个 token 都不生成**。Decider-2B 配 CUDA graphs 做到 4ms/请求。

取舍很直白：编码器便宜到可以忽略成本，但理解深度受基座限制（Laya 英文 0.820 vs 多语言 0.710）；decoder 保留 LLM 级理解力，代价是显存和单价。

Jared Palmer 用 Qwen2.5-0.5B 加 LoRA，两小时就在 MacBook 上复刻出了开源版 kev。契约不难复刻，真正难的是下一节。

## 四、真正的护城河：诚实的概率

普通分类微调，给个标签就完事。System One 给的是概率分布，而且要求这个概率**诚实**：模型说 80%，这类判断十次里就得对八次。做不到，概率就没法设阈值，前面所有架构优势全部作废。

这事有专门名字：RLCD（面向校准决策的强化学习）。TypeSafe 把它和 RLHF、RLVR 并列成第三条后训练路线：RLHF 优化"人类爱听的"，RLVR 优化"可验证的正确性"，RLCD 优化"答案对，且概率等于正确率"。

![RLHF / RLVR / RLCD 三条后训练路线对比](rlcd-three-routes.png)

数学保证来自 Gneiting & Raftery 2007 年的经典结论：严格真值评分规则的期望，当且仅当报告概率等于真实信念时唯一最优。近两年的 *Rewarding Doubt*（arXiv 2503.02623）和 MIT 的 RLCR（arXiv 2507.16806）把这条定理落成了可训练的 RL 奖励。

RLCD 的关键区别在校准对象：不是"LLM 嘴上说我 90% 有把握"那种口头置信度，而是**离散决策上的概率分布本身**——模型根本不说话，分布就是最终产物。Almeida 批 RLHF 批的就是这个：人类偏好优化会奖励谄媚和"听起来自信"。对人类有说服力，和对机器可信赖，从来是两个目标。

## 五、两个数，各管一件事

官方设计里有两个独立的量：**概率**回答"必须选一个时选哪个"（选项间的相对关系）；**置信度**回答"这个判断有多笃定"（由整条分布的形状推导，压成 0–1，专门给代码设阈值）。

Choice 的置信度公式朴素得很（n 个选项，p_max 是最高概率）：

```
confidence = (p_max − 1/n) / (1 − 1/n)
```

就是峰值概率超出均匀分布的程度。Score 的公式更讲究，利用等级的有序性：概率纠结在相邻两级（0, 0.5, 0.5）比纠结在两端（0.5, 0, 0.5）扣分少——后者明明更分裂，用 Choice 公式算却都是 0.25，这就是 Score 公式存在的理由。

工程上的标准姿势是三段式门控：

![置信度三段式门控](confidence-gating-flow.png)

高置信自动执行，中置信转人工或补信息，低置信升级给推理模型。**阈值跟着操作风险走**：查余额这种只读操作阈值可以放低；批准转账这种破坏性操作，0.9 起步。官方也明说 confidence 只是"一种合理的默认统计量"——完整分布都在返回值里，你可以自己算 top-to-second ratio 之类的替代指标。🎯

## 六、协议跑在了模型前面

这轮最让我兴奋的信号：**API 协议比模型先完成了标准化。**

TypeSafe 定义 `POST /v1/systemone`，然后：阿里云百炼的 decision-model-preview 在 Jev 发布第 9 天宣布"协议：TypeSafe System One"，端点路径照抄，SDK 直接用官方 typesafe-sdk 只换 base_url；Ollama v0.35 把它做成原生端点，本地能跑 Nimble 和 Tev1；Laya、Decider 全部暴露 Jev 兼容端点。

| 维度 | Jev (TypeSafe) | Laya | 阿里云 DM-preview | Decider / Nimble |
| --- | --- | --- | --- | --- |
| 架构路线 | 未公开（推测 decoder-logits） | 编码器（ModernBERT/mmBERT） | 未公开 | decoder-logits（Qwen3.5） |
| 参数量 | 未公开 | 322M–421M | 未公开 | 0.8B–35B |
| 延迟 | 70–500ms（云端） | 33ms（T4 本地） | ~53ms | 4ms（Decider-2B 本地） |
| 多语言 | 英文强，CJK 弱 | 100+ 语言 | 中文场景原生优化 | 依赖 Qwen 基座 |
| 微调 | 不支持（请求侧定制） | 支持 RLCD 微调，工具链完整 | 支持（白名单） | 全开源可自行训练 |
| 成本 | $0.042/M 输入 token，输出免费 | 自有硬件 | 限时免费 | 自有硬件 |

应用层写一次集成，云端 Jev、阿里云、本地 Laya 随便切——按数据敏感度、语言、延迟逐节点选实现。今年这种"标准先于垄断"的局面，真不多见。

热度数据更直白：Almeida 发布推文首日浏览超 420 万，36 小时 14 万开发者在 Vercel AI Gateway 排队；24 小时内 Vercel 付费团队 13% 已经接入——平台史上渗透最快的新模型。🔥

## 七、能打，但红线清清楚楚

发布一个月，至少四篇独立 arXiv 评测，学界显然当真了。

能力面最全面的是波恩大学 37 数据集基准（arXiv 2609.37647）：Jev 在 IMDB/SST-2/HellaSwag/ARC 上 95–99%，27/37 胜 Qwen3.8-27B，37/37 全胜 Gemma-4-E4B；选项轮换不改准确率、去掉问题掉到随机，排除了浅层模式匹配。这场评测跑了 346,009 次请求，成本不到 10 美元——这数字本身就是决策模型经济学的注脚。

落地证据也有：德州拿 Jev 把 49.9 万份警方车祸叙事编码成结构化变量（arXiv 2609.24052），对人工标签 F1 0.908，只比前沿 LLM 低 0.059，而成本由 schema 大小决定、跟叙事长度无关——这是决策模型独有的成本结构。

但红线同样清楚，三篇论文各给一条：

- **训练污染**：MMLU 计算类题目 94% vs 其他 91% 的异常，论文作者自己判断最可能是污染。头部基准数字，当上界看；
- **顺序敏感**：生物安全审计（arXiv 2609.30454）发现选项循环轮换后，37.4% 的 WMDP-Cyber 题目会改答案。缓解法是跨轮换平均概率（+3.8 个点），只对低置信条目做，几乎零成本；
- **安全场景不能只看平均**：Agent 安全评测（arXiv 2609.33401）说得最直白——准确率、概率校准、决策策略必须一起评。平均校准良好，会掩盖特定攻击类别上的系统性失败，包括"自信地判为安全"那种。⚠️

## 八、冷水比通稿更有信息量

一个技术方向值不值得押注，批评往往比 PR 稿值钱。这轮最有分量的冷水来自 Redis 创始人 antirez，单条推文 110k+ 浏览：

![antirez 的批评](quote-antirez.png)

他后来澄清：不是否认 Jev 有用，是反感关注度和技术分量不成比例。顺着这思路，工程师 Sean Goedecke 点破一个语义把戏：**"0% 幻觉"保证的是格式，不是正确性**——Jev 永远不会返回未定义的类别，但它完全可能自信地把天鹅分到"猫"里。接口契约 ≠ 事实准确，193 倍快 ≠ 193 倍聪明。

Theo Browne（t3.gg）更不留情面：一个"聪明的 if/switch 语句"。分类路由打分是好活，但别指望它浏览代码库、做高质量决策。他还点名一个流行误用——有人拿 Jev 压缩 Agent 上下文（156k → 62k token），可压缩需要综合完整决策历史，Jev 的 32k 窗口和零推理痕迹的设计，可能把"试过哪些路"的记录删掉、导致 Agent 死循环；Anthropic 自己的建议也是保留完整历史。

Simon Willison 的态度更有意思：他欢迎"决策模型"这个叫法（他和 Maggie Appleton 都觉得比 System One 准确），但警惕黑盒化。他做了个实验：让 Jev 给湾区城市打"是不是好城市"的分，Cupertino 最高、East Palo Alto 最低——一个看起来很客观的浮点数，背后的训练数据偏见，你看不到任何理由。这种分数直接拿去排名求职者？慎之。

三种批评没有一个否定方向本身，但合起来划出了同一条边界：**Jev 替代的是 LLM 工作流里"让大模型判断一下"的那一步，替代不了 LLM 本身。**

## 九、落到架构：System 1 / System 2 分层

所有信息叠起来，System One 对架构的实际贡献是一个分层：

![System 1 / System 2 分层架构](system-one-architecture-layers.png)

三个设计原则，用我的话说：

1. **模型给概率，代码做决定。** 决策模型不是 Agent，不选动作、不调工具，控制权一直在代码手里。低置信升级 System 2 或人工——这个"升级漏斗"本身就是用 confidence 阈值写的确定性逻辑。
2. **成本结构变了，算账方式也要变。** 输入计费、输出近免费、成本由 schema 大小而非生成长度决定。以前是"能不调 LLM 就不调"，现在是"每个节点都可以放个判断"。
3. **原子问题，代码组合。** 别问"评估这个创业 pitch"，拆成市场规模、技术可行性、差异化三个 score，用自己的公式加权。权重变了改代码系数，而不是重写 prompt——决策可审计性从 prompt 挪回代码，这是被严重低估的收益。

最对口的场景是 RAG 管线：query 路由、grounding 检查、答案质检——这三个你现在大概率在用 LLM + JSON mode 硬扛的环节，迁移收益最直接。三个坑先记住：二元任务 0.5 默认阈值普遍位置不佳，要用自己的数据调（UNFAIR-ToS 上调后 micro-F1 从 0.50 → 0.75）；高风险判断做选项轮换平均或策略级验证；中文负载先实测——Jev 的 CJK 弱是官方承认的，这也是阿里云版本存在的意义。

## 十、动手：Laya 部署实操教程

说了这么多，自己搭一个的成本比想象中低——一条命令的事。这份部署教程按从轻到重讲。👨‍💻

### 10.1 一条命令起服务

```bash
docker compose -f compose.yaml -f compose.http.yaml up --build laya-serve
curl -s localhost:8000/health
curl -s localhost:8000/v1/systemone -H 'content-type: application/json' \
  --data @examples/docker/request.json
```

CPU 就行，8 GB 内存、10 GB 磁盘。首次启动从 HuggingFace 拉 checkpoint 进 `model-cache` 卷，之后秒起。注意端口默认只绑 `127.0.0.1`——没设 API key 之前，别暴露公网。

### 10.2 GPU 与多平台

NVIDIA 加一层 override（CUDA 13.0 轮子）：

```bash
docker compose -f compose.yaml -f compose.http.yaml -f compose.cuda.yaml up --build laya-serve
```

DGX Spark 用 `compose.spark.yaml`（ARM64 + CUDA 13.0），别和 cuda 叠加。镜像默认设了 `TORCH_DISABLE_NATIVE_JIT=1`，背后是个诡异的坑（issue #365）：PyTorch 2.14 会把部分 CUDA 算子换成首次推理才编译的 Triton kernel，而 slim 镜像里没有 C 编译器——结果健康检查全绿、每个请求都失败。裸装 PyTorch 遇到同样报错，设同一个变量即可。

还有个贴心设计：`/health` 不只报 `device`，还有 `checkpoint_devices` 和 `device_is_preference`——GPU 静默回退 CPU 时（显存不够自动降级），健康检查会说出来，而不是把配置回显糊弄你。无人值守部署，这个字段能救命。

### 10.3 生产环境关键配置

环境变量设计得相当克制，默认值就是安全值。上线必看的几个：

| 变量 | 默认 | 为什么要管 |
| --- | --- | --- |
| `LAYA_PRELOAD` | 0（Compose 里） | 长驻服务设 `1`，启动即加载 checkpoint，第一个请求不等待 |
| `LAYA_MAX_LOADED` | 2 | 常驻内存的检查点数；低于路由实际选择数会反复重载 |
| `LAYA_MAX_CONCURRENT` | 16 | 并发上限，满了直接 503 不排队——显式背压好过队列堆积 |
| `LAYA_IDLE_UNLOAD_SECONDS` | 0（不卸载） | 空闲多少秒卸载常驻权重，内存敏感场景用 |
| `LAYA_JEV_STRICT` | 0 | 设 `1` 切严格 Jev 线协议（去掉扩展字段），接严格 Jev 客户端用 |
| `LAYA_API_KEY_FILE` | 无 | Bearer token 从文件读，比 `-e` 传密钥干净 |
| `LAYA_ROOT_PATH` | 无 | 反代后的 URL 前缀，如 `/laya` |
| `LAYA_REVISION` + `LAYA_SHA256_DIGESTS` | 无 | 供应链组合拳：pin Hub commit + 校验权重 sha256 |

完整部署形态：

![Laya 生产部署参考架构](laya-deployment.png)

### 10.4 三种部署形态怎么选

| | Jev API（托管） | 阿里云 DM-preview | Laya 自托管 |
| --- | --- | --- | --- |
| 起步成本 | 注册即用 | 注册即用，限时免费 | 一台机器 + Docker |
| 数据边界 | 出域（企业版有 ZDR） | 出域 | 完全不出域，可离线 |
| 延迟 | 70–500ms（网络往返） | ~50ms | 32ms（本地 T4），CPU 也可 |
| 多语言 | 英文强 CJK 弱 | 中文原生优化 | 100+ 语言，48/51 超 3× 随机 |
| 微调 | 不支持 | 支持（白名单） | 支持，Kaggle 免费显卡就能跑 |
| 适用 | 快速验证、英文场景 | 国内生产、中文负载 | 数据敏感、边缘、要微调 |

### 10.5 上线前 checklist

1. 用自己的真实数据评一遍——厂商基准是上界，你的工单不是 IMDB；
2. 二元任务阈值一定自己调，0.5 默认值普遍位置不佳；
3. `LAYA_PRELOAD=1` + `--wait`，别让第一个用户等模型下载；
4. API key + TLS 反代，`LAYA_BIND_ADDRESS` 别急着放开；
5. pin `LAYA_REVISION`、配 `LAYA_SHA256_DIGESTS`，权重也要供应链安全；
6. 压测看到 503 别慌——那是 `LAYA_MAX_CONCURRENT` 在显式背压，不是故障；
7. 多语言流量确认 `LAYA_DEFAULT_MODEL`，无语言特征的状态默认落 multilingual。

## 十一、我的判断：该用吗

分情况。

如果你系统里已经有"让 LLM 判断一下"的高频节点——路由、门禁、质检、核验——迁移收益是数量级的：几秒变几十毫秒，成本降两个数量级，格式错误归零。协议还标准化了，试错成本低到可以先拿阿里云免费额度跑一周真实流量。

不该用的情况同样清楚：规则固定的任务（正则和传统分类器更便宜）、需要解释的场景（按设计没有推理过程）、高风险安全决策（必须先做策略级评测，平均指标会骗人）。

**一句话总结：决策模型不抢大模型的饭碗，它抢的是大模型工作流里"最委屈"的那一环。** 从趋势预测的角度看，这大概是今年 AI 工程化最重要的一个分层信号。

你系统里有没有那种"杀鸡用牛刀"的判断节点？评论区聊聊，或者点个"在看"，把这篇转给还在用 JSON mode 硬扛的同事。👇

---

**参考资料**

1. TypeSafe AI 官方文档：<https://docs.typesafe.ai/concepts/system-one> 、/confidence
2. Diogo Almeida 发布推文：X @CompleteSkeptic（2026-09-15）
3. Simon Willison 评测：<https://simonwillison.net/tags/jev/>
4. Laya 仓库（Apache-2.0）：<https://github.com/NandhaKishorM/laya>
5. Laya 作者 dev.to 长文：*I Built Non-Autoregressive Decision Models a Year Ago. Then a Frontier Lab Called It a "Breakthrough".*
6. 阿里云决策模型 API 文档：<https://help.aliyun.com/zh/model-studio/decision-model-api>
7. The New Stack 报道：<https://thenewstack.io/typesafe-jev-system-one/>
8. Deußer et al. *Evaluating and Benchmarking the System One Model Jev*. arXiv:2609.37647
9. *Auditing System-1 Models on Biosecurity-Relevant Benchmarks*. arXiv:2609.30454
10. Liu. *Evaluating System One Models for Agent Security Decisions*. arXiv:2609.33401
11. Rafe & Das. *Calibrated Decisions at Scale*. arXiv:2609.24052
12. Damani et al. (MIT). *Beyond Binary Rewards* (RLCR). arXiv:2507.16806
13. Kahneman. *Thinking, Fast and Slow*. 2011

#AI #大模型 #LLM #SystemOne #决策模型 #Jev #TypeSafe #RAG #Agent #技术解析
