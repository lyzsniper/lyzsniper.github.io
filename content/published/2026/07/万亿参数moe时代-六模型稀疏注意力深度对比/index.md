---
title: 万亿参数 MoE 时代：六大开源大模型稀疏注意力机制深度对比
category: 大模型
featured: true
status: published
---

# 万亿参数 MoE 时代:六大开源大模型稀疏注意力机制深度对比

**——从长上下文 O(L²) 难题到工业级解决方案的全景图谱**

---

## 写在前面

2026 年上半年,中国开源大模型进入了一个分水岭:上下文长度集体冲上 1M token,稀疏注意力从"实验性技术"变成"工业级默认配置"。在这场技术范式跃迁中,六款代表性模型分别走出了截然不同的工程路径——有的选择 token 级 index 检索,有的选择 block 块级稀疏,有的激进地引入哈希碰撞压缩,有的选择低秩压缩而非真正的稀疏,还有的坚持 GQA 走完全平方的路线。

本文是对这六款模型的深度横向对比分析。涉及参数、字段、架构细节均直接来自 Hugging Face 公开 config.json 与各模型官方技术报告、README、arXiv 论文。所有对比维度均经过 config 字段 + README 关键词 + 论文/官方公告三重交叉验证。

---

## 一、2026 年开源大模型坐标:从"卷参数"到"卷稀疏"

### 1.1 参数竞赛的尽头

2025 年的开源大模型还在 70B-235B 区间激烈角逐,2026 年上半年已经完成了向万亿级的跨越:

| 模型 | 总参数 | 激活参数 | 激活比 |
|------|--------|----------|--------|
| **DeepSeek-V4-Pro** | 1.6T | 49B | 3.1% |
| **LongCat-2.0** | 1.6T | 33-56B(动态) | 2-3.5% |
| **GLM-5.2** | 744B | 40B | 5.4% |
| **Kimi-K2.7-Code** | [类 V3 大小] | [类 V3] | [类 V3] |
| **MiniMax-M3** | 428B | 23B | 5.4% |
| **Tencent Hy3-preview** | 295B | 21B | 7.1% |

一个清晰的事实是:**激活参数集体压缩在 20-50B 区间**。这是因为推理显存主要由激活参数决定,这个范围恰好能在 1-4 张 H100 上跑起来,使工业部署成为可能。

### 1.2 1M 上下文的硬性约束

六款模型中,4 款支持 1M token 上下文(LongCat-2.0、MiniMax-M3、DeepSeek-V4-Pro、GLM-5.2),2 款是 256K(Hy3-preview、Kimi-K2.7-Code)。

1M 上下文如果使用全注意力,单层 attention matrix 就要 10¹² 个元素——即使 FP8 也要 1TB 显存。这是不可接受的。**这就解释了为什么 1M 阵营的 4 款模型全部采用某种稀疏注意力机制,而 256K 阵营的 2 款分别选择 MLA 和纯 GQA**——不是技术选择,是工程必然。

### 1.3 上下文与稀疏性的强相关性

| 上下文长度 | 模型 | 稀疏机制 | 必要性 |
|-----------|------|----------|--------|
| **1M** | LongCat-2.0 | LSA | ✅ 必需 |
| **1M** | MiniMax-M3 | MSA (block-sparse) | ✅ 必需 |
| **1M** | DeepSeek-V4-Pro | CSA+HCA hybrid | ✅ 必需 |
| **1M** | GLM-5.2 | DSA + IndexShare | ✅ 必需 |
| 256K | Hy3-preview | 纯 GQA(无稀疏) | ⚠️ 软需求 |
| 256K | Kimi-K2.7-Code | MLA(非稀疏) | ⚠️ 软需求 |

**结论:上下文长度决定了稀疏注意力的必要性**。这不是巧合,是 O(L²) 复杂度的物理必然。

---

## 二、稀疏注意力机制族谱:三种哲学的分野

### 2.1 哲学一:Token 级 index 检索(DeepSeek / GLM / 部分 MiniMax)

核心思想:**训练一个轻量的 indexer 网络,让每个 query 只 attend 被 indexer 选中的 topk 个 key**。

代表性工作:DeepSeek Sparse Attention(DSA)。具体做法是:

1. 在标准 attention 之外,引入一个轻量 indexer(类似 cross-attention 简化版),它对每个 query 生成一个分数;
2. 用这个分数对所有 key 排序,选出 topk 个(典型 1024-2048);
3. 标准 attention 只在这 topk 个 key 上做计算。

**变体一**:GLM-5.2 的 IndexShare——发现相邻 4 层的 indexer 选出的 topk 几乎一致,因此**每 4 层共享一个 indexer**,节省 75% 的 indexer 计算量。IndexShare 在 1M 上下文下把 per-token FLOPs 降低了 2.9×。

**变体二**:DeepSeek-V4 的 CSA + HCA hybrid——token 级 topk(1024)再做哈希碰撞压缩,形成 60 层的混合压缩比模式(`compress_ratios=[128, 128, 4, 128, 4, ..., 0]`)——大部分层是 128 倍重度压缩(每 128 个 token 压缩为一个),中间层 4 倍压缩,最后一层不做压缩(全注意力兜底)。

**优势**:精度高,token 粒度细致;有理论保证(如果 indexer 选对了 topk,精度逼近全注意力)。

**劣势**:indexer 本身有开销,topk 数量太少时精度下降,topk 太多时节省的计算被 indexer 抵消。

### 2.2 哲学二:Block 级块稀疏(MiniMax)

核心思想:**每 128 个 token 组成一个 block,query 只 attend topk 个 block,而不是 topk 个 token**。

MiniMax-M3 的 MSA(MiniMax Sparse Attention)是这一路线的代表。config.json 里的关键字段:

```json
"sparse_attention_config": {
  "use_sparse_attention": true,
  "sparse_index_dim": 128,           // indexer 隐层维度
  "sparse_num_index_heads": 4,       // 4 个轻量 indexer 头
  "sparse_topk_blocks": 16,          // 每个 query 选 top-16 个 block
  "sparse_block_size": 128,          // 每 block 128 个 token
  "sparse_score_type": "max",        // 用 max pooling 打分
  "sparse_local_block": 1,           // 强制 attend 所在 block
  "sparse_init_block": 0,            // indexer 初始块数
  "sparse_disable_index_value": [0,0,0,1,1,1,...],  // 前 3 层不开
  "sparse_attention_freq": [0,0,0,1,1,1,...]         // 前 3 层 dense
}
```

**关键设计**:
- **sparse_local_block=1**:强制每个 query attend 自己所在的 block,这是"局部性假设"——query 和它的近邻最相关;
- **sparse_topk_blocks=16**:**有效 attend 范围 = 16×128 = 2048 tokens**,接近 DSA 的 top-2048 token 粒度;
- **前 3 层不启用稀疏**:`sparse_attention_freq` 前 3 位是 0,意味着**前三层是 dense 注意力,从第 4 层开始才激活稀疏**——这是为了保护浅层特征的完整性;
- **score_type="max"**:用 max pooling 而非 mean pooling 打分,这样选中的 block 一定包含至少一个"重要 token",而不是被平均掉。

**优势**:
- **block 粒度的硬件友好性**:在 GPU 上,块级稀疏可以转换为 cuBLAS 的 batched GEMM,实际计算效率远高于 token 级的 topk gather;
- **indexer 极轻量**:4 个 head、128 维,相比 DSA 的 32-64 个 head 节省大量显存;
- **局部性假设天然成立**:对长文代码、文档类任务,block 内的 token 经常是同主题的,block 粒度比 token 粒度更鲁棒。

**劣势**:
- 极端情况下(如一个 block 内全是"重要 token"),block 粒度会浪费计算;
- 跨 block 的依赖关系需要靠 indexer 精确捕捉,indexer 训练难度比 token 级更高。

**实测数据**:`9× prefill speedup, 15× decode speedup, per-token compute = 1/20`,在 1M 上下文下是六款模型中**实测推理效率最优秀**的。

### 2.3 哲学三:压缩 + 路由(LongCat)

LongCat-2.0 的 LSA(LongCat Sparse Attention)是这一路线的代表。它的核心思想是"双层筛选":

1. **粗粒度层**:用低秩压缩把远端 token 压缩成 latent 摘要,query 与这些 latent 做 attention;
2. **细粒度层**:对当前 query 相关的关键位置(局部窗口 + 检索式选中)做全量 attention。

**关键设计**:
- **零计算专家 + ScMoE 协同**:LongCat-2.0 的 LSA 不是独立的稀疏机制,而是与**零计算专家(Zero-Computation Expert)+ ScMoE 跨层快捷 MoE** 深度协同——简单 token 走零专家不消耗算力,只有"重要 token"才走完整 FFN;
- **动态激活范围 33B-56B**:不是固定激活参数,而是按 token 难度动态调整;
- **通信-计算协同**:零专家 token 在 EP(专家并行)通信时可以省掉 all-to-all 通信量,进一步降低推理延迟。

**优势**:
- **真正"算力用在刀刃上"**:简单 token(标点、变量名、闭合括号)不消耗算力,复杂 token(递归推导、复杂语法解析)获得更多算力;
- **与 MoE 路由天然融合**:不需要单独的 indexer,稀疏选择和专家路由可以用同一个门控网络;
- **专家并行通信效率高**:零专家的通信优化是 DSA/MSA 不具备的。

**劣势**:
- **架构复杂度最高**:LSA + 零专家 + ScMoE + MOPD 四层叠加,工程实现难度大;
- **HF 仓库 config.json 暂未公开**:对比基于美团官方公告和 OpenRouter 实证,缺乏一手架构字段(这一点必须诚实标注)。

### 2.4 哲学四:不做稀疏,做压缩(MLA,Kimi 系)

Kimi-K2.7-Code 用的 **MLA(Multi-Latent Attention)** 不是稀疏注意力,而是**KV 低秩压缩**——把 KV cache 用一个低秩矩阵压缩,query 仍 attend 所有 key(虽然用低秩近似)。

config.json 关键字段:
```json
"q_lora_rank": 1536,        // Q 的低秩分解 rank
"kv_lora_rank": 512,        // KV 的低秩分解 rank
"qk_nope_head_dim": 128,    // 不带 RoPE 的 head 维度
"qk_rope_head_dim": 64      // 带 RoPE 的 head 维度
```

**MLA 与稀疏注意力的本质区别**:

| 维度 | 稀疏注意力(DSA/MSA/CSA) | MLA |
|------|------------------------|-----|
| query 看到的 key 数量 | 选中子集 | **全部**(但用低秩近似)|
| 是否降低 attention 计算量 | ✅ 显著降低 | ❌ **不降低**(仍是 O(L²))|
| 是否降低 KV cache 显存 | ✅ 降低 | ✅ 降低(不同机制)|
| 适用上下文 | 越长越省 | 1M 也能跑(但计算量不省)|

**为什么 Kimi 不做稀疏**:Kimi-K2.7-Code 继承自 DeepSeek V3 架构(类名是 `DeepseekV3ForCausalLM`),沿用 MLA 是"已知稳定"的工程选择。256K 上下文用 MLA 也能跑,没必要冒稀疏注意力的工程风险。

### 2.5 哲学五:纯 GQA 不做稀疏(Hy3)

Hy3-preview 是六款中**唯一完全不用任何稀疏/压缩技术**的模型。从 config.json 看:

- 没有 index 字段(不是 DSA)
- 没有 sparse_attention_config(不是 block-sparse)
- 没有 compress_* 字段(不是 CSA)
- 没有 kv_lora_rank(不是 MLA)
- 只有 `num_key_value_heads=8, num_attention_heads=64` → **纯 GQA**

**为什么 Hy3 不做稀疏**:可能是因为 256K 上下文用纯 GQA 已经够用(显存和延迟都可控),而且 GQA 架构简单、训练稳定。在 1M 上下文下 Hy3 是否还能坚持纯 GQA,需要等后续版本观察。

---

## 三、六模型机制参数对比

### 3.1 稀疏注意力核心参数(来自 config.json)

| 参数 | LongCat-2.0 | MiniMax-M3 | DSV4-Pro | GLM-5.2 | Hy3 | Kimi-K2.7 |
|------|-------------|-----------|---------|---------|-----|-----------|
| **机制名** | LSA | MSA | CSA+HCA | DSA+IndexShare | GQA | MLA |
| **路由粒度** | [未公开] | block(128) | token(1024) | token(2048) | N/A | N/A |
| **indexer 头数** | [未公开] | 4 | 64 | 32 | 0 | 0 |
| **indexer dim** | [未公开] | 128 | 128 | 128 | 0 | 0 |
| **topk 数量** | [未公开] | 16 blocks(2048 tok) | 1024 tokens | 2048 tokens | N/A | N/A |
| **block 大小** | [未公开] | 128 | N/A | N/A | N/A | N/A |
| **hash 层数** | [未公开] | 0 | 3 | 0 | 0 | 0 |
| **压缩比** | [未公开] | 无 | [128,128,4,128,4,...,0] | 无 | 无 | 低秩(512) |
| **IndexShare 频率** | [未公开] | 1(每层独立) | 1(每层独立) | **4(每 4 层共享)**| N/A | N/A |
| **前 k 层 dense** | [未公开] | 3 | [未在 config] | 3 | 0 | 0 |
| **首 k 层 dense 替换** | [未公开] | 0(从 1 起 MoE) | [未在 config] | 3 | 1 | 1 |
| **MoE 层频率** | [未公开] | [0,0,0,1,1,1,...] | [未在 config] | 1 | 1 | 1 |

### 3.2 MoE 路由参数对比

| 参数 | LongCat-2.0 | MiniMax-M3 | DSV4-Pro | GLM-5.2 | Hy3 | Kimi-K2.7 |
|------|-------------|-----------|---------|---------|-----|-----------|
| **总专家数** | [未公开] | 128 routed + 1 shared | 384 routed + 1 shared | 256 routed + 1 shared | [未在 config] | 384 routed + 1 shared |
| **topk** | [未公开] | 4 | 6 | 8 | 8 | 8 |
| **scoring** | [未公开] | sigmoid | [未在 config] | [未在 config] | sigmoid | sigmoid |
| **router bias** | [未公开] | **true**(自研) | [未在 config] | [未在 config] | **true** | [未在 config] |
| **first_k_dense** | [未公开] | 0 | [未在 config] | 3 | 1 | 1 |
| **专家维度** | [未公开] | [未在 config] | 3072 | 2048 | 1536 | 2048 |

### 3.3 注意力头参数对比

| 参数 | LongCat-2.0 | MiniMax-M3 | DSV4-Pro | GLM-5.2 | Hy3 | Kimi-K2.7 |
|------|-------------|-----------|---------|---------|-----|-----------|
| **num_heads** | [未公开] | 64 | 128 | 64 | 64 | 64 |
| **num_kv_heads** | [未公开] | 4 | 1 | 64(MHA) | 8 | 64(MHA) |
| **head_dim** | [未公开] | 128 | 512 | 192 | 128 | 192 |
| **qk_norm** | [未公开] | [未在 config] | [未在 config] | [未在 config] | true | [未在 config] |
| **use_gemma_norm** | [未公开] | **true** | [未在 config] | [未在 config] | [未在 config] | [未在 config] |

### 3.4 上下文与位置编码

| 参数 | LongCat-2.0 | MiniMax-M3 | DSV4-Pro | GLM-5.2 | Hy3 | Kimi-K2.7 |
|------|-------------|-----------|---------|---------|-----|-----------|
| **max_position** | **1M** | **1M** | **1M** | **1M** | 256K | 256K |
| **rope_theta** | [未公开] | 10000(估) | 10000 | 10000(估) | [未在 config] | [未在 config] |
| **rope_scaling** | [未公开] | [未在 config] | **YaRN, factor=16, base=64K** | [未在 config] | [未在 config] | **YaRN, factor=64, base=4K** |
| **sliding_window** | [未公开] | [未在 config] | 128 | [未在 config] | [未在 config] | [未在 config] |
| **是否多模态** | ❌ | ✅ VL(CLIP) | ❌ | ❌ | ❌ | ✅ Code-VL |

---

## 四、深度机制对比:同类机制的内部差异

### 4.1 Token 级 index 检索三强对比(DSV4 vs GLM-5.2 vs [MiniMax])

这三款都基于"indexer 选 topk"思想,但实现差异巨大:

| 维度 | DSV4 (CSA+HCA) | GLM-5.2 (DSA+IndexShare) | MiniMax-M3 (MSA block) |
|------|---------------|------------------------|----------------------|
| **粒度** | token | token | block(128) |
| **topk** | 1024 token | 2048 token | 16 block = 2048 token |
| **indexer 头** | 64 | 32 | 4 |
| **额外压缩** | ✅ 哈希碰撞 + ratio 混合 | ❌ 无 | ❌ 无 |
| **跨层共享** | ❌ 每层独立 | ✅ **IndexShare 4 层共享** | ❌ 每层独立 |
| **1M 下 FLOPs 节省** | **73%(vs V3.2)** | **65%(2.9×)** | **95%(1/20)** |
| **KV cache 节省** | **90%(vs V3.2)** | [未明确] | [未明确] |
| **训练难度** | 极高(混合压缩比) | 中(共享 indexer) | 中(block 粒度) |
| **硬件友好** | 中(哈希) | 高(MHA 对称) | **极高**(块稀疏 GEMM) |

**关键观察**:
- **GLM-5.2 IndexShare 是最优雅的优化**——用"相邻层 indexer 几乎一致"这一经验观察,把 indexer 计算量降低 75% 而不损失精度,1M 下 FLOPs 降 2.9×;
- **DSV4 的 CSA+HCA 是最激进的压缩**——在 token topk 之上再做哈希压缩,1M 下 KV cache 降到 V3.2 的 10%,但训练复杂度最高;
- **MiniMax-M3 的 block 粒度是硬件最友好的**——9× prefill / 15× decode / 1/20 compute,实测推理效率最好。

### 4.2 零计算专家 vs 共享专家:两种 MoE 增强

长上下文 + MoE 有一个隐性问题:每个 token 都要走 MoE 路由,简单 token(标点)走完 MoE 也浪费算力。LongCat-2.0 和 Kimi 系/GLM 系用不同方式解决:

| 方案 | 代表 | 机制 | 优势 | 劣势 |
|------|------|------|------|------|
| **零计算专家** | LongCat-2.0 | 引入"不计算的专家",简单 token 走它跳过 FFN | token 级动态算力,可省通信 | 架构复杂,需新算子 |
| **共享专家** | Kimi/GLM/DSV4 | 每层 1 个 expert 所有 token 都走,被 routed expert 加权补充 | 架构简单,稳定 | 共享 expert 仍是固定开销 |
| **首 k 层 dense** | GLM-5.2(3 层)/ Hy3(1 层) | 浅层用 dense FFN,深层才 MoE | 保护浅层特征 | 浅层算力浪费 |

**LongCat-2.0 的零计算专家是六款中最激进的 MoE 优化**——它把"算力按需分配"的理念推到了 token 级。

### 4.3 路由函数:sigmoid vs softmax

| 模型 | 路由函数 | 特点 |
|------|---------|------|
| MiniMax-M3 | **sigmoid** | 每个 expert 独立判断,允许多 expert 同时高分 |
| Hy3-preview | **sigmoid** + **expert bias** | sigmoid 基础上加可学习 bias |
| Kimi-K2.7 | **sigmoid** + **norm_topk_prob=true** | sigmoid + 概率归一化 |
| DSV4-Pro | [未在 config 显式] | - |
| GLM-5.2 | [未在 config 显式] | - |
| LongCat-2.0 | [未公开] | - |

**MiniMax-M3 的 use_routing_bias=true 是少见的设计**——给每个 expert 一个可学习的偏置项,允许动态调整 expert 负载,在训练后期减少"死 expert"问题。

### 4.4 归一化方式:MiniMax 的 GemmaNorm

MiniMax-M3 的 `use_gemma_norm=true` 表明它使用 Gemma 风格的 RMSNorm(而非标准 LayerNorm 或 RMSNorm)。这种归一化方式在输入侧把 weight 乘以 (1 + scale),可以提升训练稳定性,是 Google Gemma 模型的开创性改进。

---

## 五、实测效率对比:数字背后的真相

### 5.1 1M 上下文的 FLOPs 节省

| 模型 | 1M 上下文 FLOPs 节省 | 1M 上下文 KV cache 节省 | 备注 |
|------|---------------------|------------------------|------|
| **DSV4-Pro** | **73%** (vs V3.2 27%) | **90%** (vs V3.2 10%) | 实测数字 |
| **GLM-5.2** | **65%** (2.9× via IndexShare) | [未明确] | 实测数字 |
| **MiniMax-M3** | **95%** (per-token compute = 1/20) | [未明确] | 实测数字 |
| **LongCat-2.0** | [未明确数字] | [未明确] | 官方未披露 |
| **Hy3** | 0% (无稀疏) | 0% | 不适用 |
| **Kimi-K2.7** | 0% attention FLOPs,但 KV 压缩 | 部分 (kv_lora_rank 512) | MLA 路线 |

**真实含义**:
- MiniMax-M3 的 1/20 compute 看似最夸张,但要注意这是"per-token compute",且它的总参数也最小(428B);
- DSV4-Pro 的 27%/10% 是在**保持 V3.2 精度不退化**前提下测得,工程意义最大;
- GLM-5.2 的 2.9× 是 IndexShare 单一优化带来的,叠加 DSA 本身的 topk 节省,总节省应该远高于 2.9×。

### 5.2 推理速度提升(MiniMax 自报)

| 指标 | MiniMax-M3 vs M2 | 备注 |
|------|------------------|------|
| **Prefill speedup** | 9× | 1M 上下文下 |
| **Decode speedup** | 15× | 1M 上下文下 |
| **Per-token compute** | 1/20 | |

这是六款模型中**唯一有完整推理加速数字的**——但要注意这是"同公司前后版本对比",不是跨模型横比。

### 5.3 真实工程门槛

| 模型 | 推理门槛(估) | 部署生态 |
|------|--------------|---------|
| **LongCat-2.0** | ~96GB FP16 (48B 激活) | 美团自家引擎 |
| **DSV4-Pro** | ~98GB FP16 (49B 激活) | transformers 5.x+, vLLM 兼容 |
| **GLM-5.2** | ~80GB FP16 (40B 激活), FP8 减半 | SGLang / vLLM / **Ascend NPU** |
| **MiniMax-M3** | ~46GB FP16 (23B 激活) | SGLang / vLLM / KTransformers / unsloth / **Transformers** |
| **Hy3** | ~42GB FP16 (21B 激活) | vLLM / SGLang 兼容(DeepSeek V3 类) |
| **Kimi-K2.7** | ~30GB FP16 (类 V3) | DeepSeek V3 兼容 |

**最易部署**:MiniMax-M3(23B 激活 + 完整 transformers 支持)。  
**最难部署**:LongCat-2.0(权重暂未开源)。

---

## 六、第三方基准对比:厂商自报数字的合理怀疑

### 6.1 真实可信的横评极其稀缺

六款模型在各家官方公告中给出的 benchmark 数字,**没有**任何第三方独立横评覆盖。这就是说:
- LongCat-2.0 自报 SWE-bench Pro 59.5,Terminal-Bench 2.1 70.8
- GLM-5.2 自报 Terminal-Bench 2.1 **81.0**,SWE-bench Pro **62.1**
- DSV4-Pro 自报"V4-Pro-Max redefines SOTA"但具体数字需要查 arXiv 2606.19348 全文
- Hy3-preview 暂未发布横评
- Kimi-K2.7-Code 暂未发布横评
- MiniMax-M3 自报"frontier-level"但具体数字需要查 arXiv 2606.13392 全文

**值得注意的对比**:LongCat-2.0 vs GLM-5.2 在同一基准上的数字差异:
- Terminal-Bench 2.1: GLM-5.2 81.0 vs LongCat-2.0 70.8(差 10.2 分)
- SWE-bench Pro: GLM-5.2 62.1 vs LongCat-2.0 59.5(差 2.6 分)

**但这不能简单解读为 GLM-5.2 全面更强**——因为:
1. Terminal-Bench 2.1 是 GLM-5.2 的强项("multiple thinking effort levels")
2. LongCat-2.0 的"零计算专家"架构理论上更利于长程任务,但 Terminal-Bench 偏短
3. 评测时间、prompt 模板、tool 沙箱都可能不同

### 6.2 真实的"全球前三"现象

LongCat-2.0 之前以匿名代号 "Owl Alpha" 在 OpenRouter 上线,OpenRouter 数据显示:
- **总调用量跻身全球前三**
- 在 Hermes、Claude Code、OpenClaw 三大 Agent Harness 上月调用量分别位列全球 1/2/3
- "在 Claude Code 的月调用量,仅次于 Claude Opus 4.8"

这个数据**比任何 benchmark 都更有说服力**——开发者**不知道**这是中国模型的情况下主动选择它跑 Coding/Agent 任务,这是真实的产品力验证。

但同样需要标注:**这个数据来自美团官方公告,OpenRouter 官方没有公开同口径的横评**。

---

## 七、架构哲学的深层差异:为什么 6 家做出了 6 种选择

### 7.1 训练成本 vs 推理成本

| 关注点 | 代表 | 选择 |
|--------|------|------|
| **优先压训练成本** | LongCat-2.0 | 零计算专家(动态激活)+ 国产算力训练 |
| **优先压推理成本** | GLM-5.2 | IndexShare(共享 indexer,推理时省 75% indexer 开销) |
| **优先压 KV cache** | DSV4-Pro | CSA+HCA 压缩(1M KV cache = V3.2 的 10%) |
| **优先压总计算量** | MiniMax-M3 | block 稀疏(per-token compute = 1/20) |
| **优先稳定** | Hy3 / Kimi | 沿用成熟 GQA / MLA,不冒工程风险 |

### 7.2 工程成熟度 vs 技术先进性

| 模型 | 架构新颖度 | 工程成熟度 | 适合场景 |
|------|-----------|-----------|----------|
| **LongCat-2.0** | ⭐⭐⭐⭐⭐ | ⭐⭐(权重未公开) | 实验室研究 |
| **MiniMax-M3** | ⭐⭐⭐⭐(block sparse 自研) | ⭐⭐⭐⭐⭐(完整开源) | 快速上手 |
| **DSV4-Pro** | ⭐⭐⭐⭐⭐(CSA+HCA + mHC + Muon) | ⭐⭐⭐⭐(transformers 5.x+) | 工业部署 |
| **GLM-5.2** | ⭐⭐⭐⭐(IndexShare) | ⭐⭐⭐⭐⭐(SGLang + Ascend NPU) | 国产化部署 |
| **Hy3** | ⭐⭐(纯 GQA,无创新) | ⭐⭐⭐⭐(V3 兼容) | 稳定基线 |
| **Kimi-K2.7** | ⭐(V3 继承,几乎无创新) | ⭐⭐⭐⭐⭐(V3 生态) | Code 任务 |

### 7.3 国产化 vs 全球化

| 模型 | 训练硬件 | 推理兼容性 | 国产化路径 |
|------|---------|-----------|-----------|
| **LongCat-2.0** | **国产 5万卡 NPU 集群** | [未明确] | ✅ 100% 国产算力 |
| **GLM-5.2** | [未明确] | ✅ **Ascend NPU 原生支持** | ✅ 国产 NPU 路径 |
| **DSV4-Pro** | [未明确] | 标准 CUDA | ❌ 主要英伟达 |
| **MiniMax-M3** | [未明确] | 标准 CUDA + Transformers | ❌ 主要英伟达 |
| **Hy3** | [未明确] | 标准 CUDA | ❌ 主要英伟达 |
| **Kimi-K2.7** | [未明确] | 标准 CUDA | ❌ 主要英伟达 |

**只有 LongCat-2.0 和 GLM-5.2 明确支持国产 NPU 路径**。这是中国 AI 基础设施层最关键的分水岭。

---

## 八、风险与未解之谜

### 8.1 长期可靠性问题

| 风险 | 模型 | 严重度 |
|------|------|--------|
| **零计算专家的路由不稳定性** | LongCat-2.0 | 高 - 训练中路由可能"塌缩"到全选/全不选 |
| **IndexShare 的精度退化** | GLM-5.2 | 中 - 4 层共享 indexer 在某些任务上可能精度不足 |
| **CSA+HCA 的训练不稳定性** | DSV4-Pro | 中 - 60 层混合压缩比训练极难收敛 |
| **block 稀疏的负载不均** | MiniMax-M3 | 低 - block 粒度天然均衡 |
| **MLA 的低秩信息损失** | Kimi-K2.7 | 中 - 长上下文下信息损失累积 |

### 8.2 多模态缺位

只有 3 款支持多模态:
- **MiniMax-M3** (原生多模态,1M 上下文)
- **Kimi-K2.7-Code** (Code 多模态)
- **Tencent Hy3** (有 Hunyuan 图像模型,但 Hy3-preview 本身是纯文本)

LongCat-2.0、DSV4-Pro、GLM-5.2 **都还没有多模态**。这与 2025 年下半年多模态成为标配的趋势相反,可能是这些模型在"先把语言模型做透"。

### 8.3 真正的开放度差异

| 模型 | 权重 | Config | Tokenizer | 推理代码 | 训练代码 | 算子 | 论文 |
|------|------|--------|-----------|---------|---------|------|------|
| **LongCat-2.0** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **MiniMax-M3** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (2606.13392) |
| **DSV4-Pro** | ✅(Preview) | ✅ | ✅ | ✅(transformers) | ❌ | ❌ | ✅ (2606.19348) |
| **GLM-5.2** | ✅ | ✅ | ✅ | ✅(SGLang/vLLM) | ❌(slime 部分) | ❌ | ✅ (2602.15763) |
| **Hy3-preview** | ✅ | ✅ | ✅ | ✅(V3 兼容) | ❌ | ❌ | ❌ |
| **Kimi-K2.7-Code** | ✅(V3 架构) | ✅ | ✅ | ✅(V3 兼容) | ❌ | ❌ | ❌ |

**MiniMax-M3 是六款中开放度最高的**——权重 + 算子 + 训练代码 + 论文全部开源。

**LongCat-2.0 是六款中开放度最低的**——目前 HF 仓库只有 README + 几张图,没有权重,没有 config,没有推理代码,没有论文。这是一个值得关注的"信息不对称"。

---

## 九、给不同角色的建议

### 9.1 给研究者

如果你的目标是**研究稀疏注意力的算法**:
- 首选 **MiniMax-M3** —— 唯一全开源,有论文,有独立算子实现;
- 次选 **GLM-5.2** —— DSA + IndexShare 优雅,IndexCache 论文可深读;
- 进阶 **DSV4-Pro** —— CSA+HCA 复杂但效果最好,需读 arXiv 2606.19348 全文。

如果你的目标是**复现实验**:
- MiniMax-M3 (有完整开源) > GLM-5.2 (transformers 兼容) > 其他。

### 9.2 给工业部署方

如果你的目标是**生产环境 1M 上下文**:
- **优先 GLM-5.2** —— SGLang + vLLM + **Ascend NPU** 三家原生支持,生态最完善;
- **次选 DSV4-Pro** —— 1M 下 KV cache 节省最大(90%),长程 Agent 任务成本最低;
- **谨慎 LongCat-2.0** —— 权重未开源,需要等美团正式放权。

如果你的目标是**Coding/Agent 任务**:
- **看长程执行能力**:LongCat-2.0 / GLM-5.2;
- **看工具调用精度**:DSV4-Pro (V4-Pro-Max);
- **看成本**:MiniMax-M3 (23B 激活,部署成本最低)。

### 9.3 给国产化需求方

如果你的目标是**全栈国产化**:
- **必须**:LongCat-2.0 (训练 + 推理全栈国产) + GLM-5.2 (Ascend NPU 兼容);
- **次选**:等待 LongCat-2.0 权重开源 + GLM-5.2 算子适配;
- **关注**:美团 + 智谱 + 国产 NPU 厂商的协同进展。

### 9.4 给产品经理

如果你的目标是**快速上线 Coding Agent**:
- **Hugging Face 一键下载**:MiniMax-M3 / Hy3 / Kimi-K2.7 都有完整 HF 仓库;
- **vLLM 兼容**:GLM-5.2 / Hy3 / Kimi-K2.7;
- **国产化兼容**:GLM-5.2 (Ascend NPU)。

---

## 十、总结:六条路通向同一个目的地

2026 年上半年的开源大模型,用六种不同的工程路径,共同回答了同一个问题:**"如何在 1M 上下文下保持 O(L) 的注意力计算复杂度?"**

- **DeepSeek** 选择 token 级 topk + 哈希压缩,得到 KV cache 节省最大的工程方案;
- **GLM(智谱)** 选择 token 级 topk + 跨层 indexer 共享,得到最优雅的"少做但做对"方案;
- **MiniMax** 选择 block 粒度稀疏,得到硬件最友好的实测加速方案;
- **LongCat(美团)** 选择粗细双层筛选 + 零计算专家,得到最激进的"算力按需分配"方案;
- **Tencent** 选择坚守纯 GQA,在 256K 上下文下用工程简单换稳定;
- **Moonshot** 选择 MLA 低秩压缩,在 256K 上下文下用压缩换 KV 节省。

**没有"谁对谁错",只有"谁适合谁"**——这就是开源大模型生态的真正价值:让不同的工程哲学并行,让市场最终选择最优解。

**真正值得关注的趋势**是:**1M 上下文已经不可逆地成为开源旗舰模型的标配,稀疏注意力是这场演进的唯一可行路径**。任何还想在 1M 上下文下坚持全注意力的尝试,都将在 1-2 年内被工程现实淘汰。

---

**附录:六模型架构速查表**

| 模型 | 总参 | 激活 | 上下文 | 机制 | Indexer 头 | 顶级 | 开源 |
|------|------|------|--------|------|----------|------|------|
| **LongCat-2.0** | 1.6T | 33-56B | 1M | LSA+零专家 | [未公开] | Token+零专家 | ❌ |
| **MiniMax-M3** | 428B | 23B | 1M | MSA block | 4 | Block | ✅ |
| **DSV4-Pro** | 1.6T | 49B | 1M | CSA+HCA | 64 | Token+Hash | ⚠️ |
| **GLM-5.2** | 744B | 40B | 1M | DSA+IndexShare | 32 | Token+Share | ✅ |
| **Hy3-preview** | 295B | 21B | 256K | 纯 GQA | 0 | N/A | ✅ |
| **Kimi-K2.7** | [V3] | [V3] | 256K | MLA | 0 | N/A | ✅ |
