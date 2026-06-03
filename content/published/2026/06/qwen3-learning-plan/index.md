# Qwen3 源码学习方式计划（面向后端 AI Agent 工程师）

> 目标：你不需要先把“模型原理”学到学术深度，而是用**工程可落地**的方式，从 Qwen3 仓库出发，建立一张“从请求到生成、从评测到部署”的全链路心智模型；随后再回填必要的 Transformer/推理/对齐概念。

---

## 0. 你将产出的 5 个可交付成果（建议做成自己的笔记/小结）

- **代码地图**：本仓库中“评测/推理/部署/示例/文档”的入口文件与目录清单（能说清每个目录负责什么）。
- **推理链路图**：一次文本生成，从 prompt 输入到 token 输出，经历的关键模块（tokenizer → 模型前向 → sampling/decoding → 停止条件）。
- **评测链路图**：一次评测如何组织数据、如何并发请求、如何记录结果与复现。
- **部署选择表**：Transformers / vLLM / TGI / sglang / llama.cpp 等方式，分别适用什么场景、优缺点是什么。
- **“概念回填”清单**：每当你读代码遇到概念（KV Cache、RoPE、logits、temperature、top-p、speculative decoding…），记录并补齐到最小可用理解。

---

## 1. 仓库入口与阅读顺序（先跑通工程，再补原理）

### 1.1 先看“你能直接用到的”入口

- 仓库总览：`README.md`（根目录）
- 技术报告：`Qwen3_Technical_Report.pdf`
- 示例：`examples/README.md`、`examples/demo/cli_demo.py`、`examples/demo/web_demo.py`
- 评测：`eval/README.md`、`eval/eval/eval.py`、`eval/eval/arc_agi_1.py`
- 并发请求/生成答案（很贴近后端工程）：`eval/generate_api_answers/infer_multithread.py`、`eval/generate_api_answers/utils_vllm.py`

你当前已经在看 `eval/generate_api_answers/infer_multithread.py`，这非常适合作为“从工程入手”的第一站。

### 1.2 再看“部署与推理方式”的对比文档（先建立选型直觉）

在 `docs/source/` 中优先看：
- 推理：`docs/source/inference/transformers.md`
- 本地：`docs/source/run_locally/ollama.md`、`docs/source/run_locally/llama.cpp.md`
- 部署：`docs/source/deployment/vllm.md`、`docs/source/deployment/tgi.rst`、`docs/source/deployment/sglang.md`
- 量化：`docs/source/quantization/awq.md`、`docs/source/quantization/gptq.md`

---

## 2. 以“后端工程师视角”切入的核心问题清单

读源码/文档时，始终围绕这些问题做标注：

- **请求接口是什么样**：输入字段（prompt/system/tools/stop/max_tokens/temperature/top_p/seed…）有哪些？
- **并发与吞吐怎么做**：线程/进程/异步？批处理（batching）在哪？队列/限流/重试策略在哪？
- **性能瓶颈在哪**：prefill vs decode；KV Cache；上下文长度；量化；GPU 显存；多卡并行。
- **稳定性怎么保证**：超时、OOM、异常恢复、日志、可观测性（latency、tokens/s、成功率）。
- **结果如何复现**：固定 seed、固定采样参数、固定模型版本、固定 tokenizer。

---

## 3. 4 周学习节奏（每周 5–7 小时即可）

> 你可以把“周”理解为一个迭代；如果你更碎片化，可以按“模块”推进。

### 第 1 周：建立代码地图 + 跑通评测链路（读懂数据如何流动）

- 阅读 `eval/README.md`，搞清楚：
  - 评测输入在哪里（`eval/data/`）
  - 配置在哪里（`eval/configs/`）
  - 输出在哪里（`eval/output/`、`eval/eval_res/`）
- 精读 `eval/eval/eval.py`、`eval/eval/arc_agi_1.py`：
  - 入口函数/参数解析
  - 数据加载与格式
  - 打分/统计逻辑
- 精读 `eval/generate_api_answers/infer_multithread.py`：
  - 线程池/并发模型
  - 请求封装、重试与错误处理
  - 输出落盘格式（便于复现与分析）

**本周检查点**：你能用一句话解释“这个仓库的评测是如何从数据集到结果文件的”。

### 第 2 周：理解推理参数与解码（把“生成”当作一个可配置的后端服务）

- 阅读 `docs/source/inference/transformers.md` 与 `docs/source/deployment/vllm.md`：
  - 哪些参数影响质量/多样性/长度/速度
  - vLLM 为什么快（工程层面的解释即可：continuous batching、KV cache 管理等）
- 在代码里把以下概念对齐到“输入/输出变量”：
  - logits、softmax、temperature、top-k、top-p、repetition penalty、stop sequences、max_new_tokens
  - prefill（首轮）与 decode（逐 token）

**本周检查点**：你能解释“同样的 prompt，为什么不同 temperature/top_p 会得到不同回答”，并且能在代码中指出参数在哪里被传递。

### 第 3 周：部署与选型（把推理当作一个线上系统）

- 阅读 `docs/source/deployment/` 下你最可能用到的两种：
  - `vllm.md`（高吞吐线上推理常用）
  - `tgi.rst` 或 `sglang.md`（看你团队栈）
- 阅读 `docs/source/quantization/`：
  - 量化的工程收益（显存/速度）与代价（精度/兼容性）
- 用“后端 SRE/平台”视角整理：
  - 指标：首 token 延迟、tokens/s、并发、显存、失败率
  - 风险：长上下文、工具调用输出膨胀、OOM、热点 prompt

**本周检查点**：你能给出一个“部署方式选择表”（什么时候用 Transformers，什么时候用 vLLM，什么时候考虑 llama.cpp/ollama）。

### 第 4 周：回填最必要的模型原理（只学能解释工程现象的部分）

按“遇到就补”的方式补齐：

- **Transformer 生成到底在做什么**：
  - 自注意力（Self-Attention）为何是 O(n^2)（解释长上下文慢）
  - KV Cache 为何能让 decode 更快（解释为什么长 prompt prefill 慢）
- **位置编码/长上下文**：RoPE 与长上下文外推（解释为什么长上下文质量可能掉）
- **对齐与 Agent 能力**：
  - Instruct/Chat 模型与 base 模型差异
  - 工具调用（function call）的结构化输出约束

**本周检查点**：你能用 2–3 段话解释“prefill 慢、decode 快”“KV cache 是什么”“为什么长上下文既慢又可能影响质量”。

---

## 4. 建议的“源码精读方法”（避免陷入细节）

- **先画数据流**：每读一个脚本，先标出输入/输出：参数 → 请求体 → 返回值 → 结果文件。
- **先抓边界**：只追到“跨模块边界”的函数调用（例如：构造请求、调用 vLLM/Transformers、解析响应），不要立刻钻进模型内部实现。
- **记录 10 个关键词**：每周只要求你真正理解并能解释 10 个新关键词；其它先放进“回填清单”。
- **用“工程现象”倒推原理**：看到性能/显存/质量差异时，再去补相应原理，学习效率最高。

---

## 5. 你现在就可以从这 3 个文件开始（与你的角色最贴近）

- `eval/generate_api_answers/infer_multithread.py`：并发、错误处理、吞吐优化的工程入门点
- `eval/generate_api_answers/utils_vllm.py`：与 vLLM/推理后端交互的关键封装
- `eval/eval/eval.py`：评测入口与结果汇总，便于建立端到端理解

建议你读的时候顺手回答这些问题并写在旁边：
- 这个脚本的“最小输入”是什么？“最终输出”是什么？
- 并发策略是什么？失败怎么处理？
- 生成参数在哪里定义、在哪里传递、在哪里生效？

---

## 6. 如果你希望我继续带你走读

你可以把你正在看的文件片段（例如 `infer_multithread.py` 的某个函数）贴出来或直接 @ 引用，我可以按“后端工程师友好”的方式逐段解释：
- 这段代码在链路里扮演什么角色
- 关键参数/边界条件是什么
- 常见坑（超时/OOM/重试风暴/结果不可复现）怎么避免
