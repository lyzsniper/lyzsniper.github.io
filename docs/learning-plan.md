# 技术栈学习计划

> 更新日期：2026-07-03
> 范围：知识图谱中新增的技术项（不含已熟练掌握的）
> 目标：从当前水平提升到可独立交付

---

## 学习优先级说明

| 优先级 | 含义 |
|---|---|
| P0 | 核心工作依赖，1-2 周内必须掌握 |
| P1 | 项目扩展需要，1-2 个月内掌握 |
| P2 | 知识广度补充，3-6 个月内了解 |

---

## P0 — 核心工作依赖（AI Agent 方向）

### ADK (Agent Development Kit)
- **当前水平**：了解
- **目标**：独立搭建 ADK Agent 项目
- **学习路径**：
  1. 阅读 Google ADK 官方文档（Python/Java）
  2. 跑通 ADK + Gemini 的 quickstart
  3. 实现一个多工具调用的 Agent 示例
  4. 对比 ADK vs LangGraph vs CrewAI 的适用场景
- **产出**：一个可运行的 ADK Agent demo
- **时间**：1 周

### OpenAI SDK
- **当前水平**：用过
- **目标**：熟练使用 Function Calling + Streaming
- **学习路径**：
  1. 阅读 OpenAI API 最新文档（v1.x）
  2. 实现 Function Calling 完整流程（定义工具→调用→返回）
  3. 实现 Streaming + 工具调用的组合
  4. 了解 Structured Output（JSON Mode）
- **产出**：一个带工具调用的 ChatGPT 代理
- **时间**：3-5 天

### Skills Protocol
- **当前水平**：了解
- **目标**：理解协议规范，能设计自定义 Skill
- **学习路径**：
  1. 阅读 Skills Protocol 规范文档
  2. 分析 Dify/Coze 的 Skills 实现
  3. 设计一个自定义 Skill（如数据库查询 Skill）
- **产出**：一个可复用的 Skill 定义
- **时间**：1 周

### Embedding + Reranker
- **当前水平**：用过向量检索
- **目标**：理解 Embedding 模型选型 + Reranker 优化
- **学习路径**：
  1. 对比 text-embedding-3 / BGE / m3e 等模型
  2. 理解 Reranker（bge-reranker-v2-m3 等）
  3. 实现 Embedding + Reranker 的两阶段检索
- **产出**：RAG 检索质量对比报告
- **时间**：1 周

---

## P0 — LLM 推理方向

### vLLM 深入
- **当前水平**：部署过
- **目标**：理解 PagedAttention + 量化部署
- **学习路径**：
  1. 阅读 vLLM 架构文档（PagedAttention 原理）
  2. 部署 Qwen2.5-7B + vLLM + AWQ 量化
  3. 压测对比 vLLM vs Transformers 推理吞吐
- **产出**：量化部署 + 压测报告
- **时间**：1 周

### AWQ / GPTQ / LoRA
- **当前水平**：用过
- **目标**：理解三种量化/微调方法的适用场景
- **学习路径**：
  1. 对比 AWQ（推理快）vs GPTQ（压缩率高）vs LoRA（可训练）
  2. 实操：用 AutoAWQ 量化一个 7B 模型
  3. 实操：用 LoRA 微调一个分类任务
- **产出**：量化/微调对比实验报告
- **时间**：2 周

### DeepSeek
- **当前水平**：未深入
- **目标**：了解 DeepSeek 系列模型特点
- **学习路径**：
  1. 阅读 DeepSeek-V3 / DeepSeek-R1 技术报告
  2. 部署 DeepSeek-R1-Distill-Qwen-7B
  3. 对比 DeepSeek vs Qwen vs Claude 在 Agent 任务上的表现
- **产出**：模型对比评测
- **时间**：1 周

---

## P1 — 项目扩展需要

### Spring Cloud 深入
- **当前水平**：用过 Spring Boot
- **目标**：掌握 Spring Cloud 微服务全家桶
- **学习路径**：
  1. Nacos 服务注册与配置中心
  2. Spring Cloud Gateway 网关
  3. Sentinel 限流熔断
  4. Seata 分布式事务
- **产出**：微服务 demo 项目
- **时间**：2 周

### LangChain4j
- **当前水平**：用过 LangChain (Python)
- **目标**：掌握 Java 版 LLM 编排
- **学习路径**：
  1. 阅读 LangChain4j 文档
  2. 实现 Java + LangChain4j + Qwen 的 RAG 示例
  3. 对比 LangChain4j vs Spring AI
- **产出**：Java RAG demo
- **时间**：1 周

### Milvus 深入
- **当前水平**：部署过
- **目标**：理解索引优化 + 混合检索
- **学习路径**：
  1. 理解 IVF_PQ / HNSW 索引
  2. 实现标量过滤 + 向量检索的混合查询
  3. 压测不同索引的 QPS vs 召回率
- **产出**：Milvus 索引优化报告
- **时间**：1 周

### Qdrant
- **当前水平**：未深入
- **目标**：了解 Qdrant vs Milvus 差异
- **学习路径**：
  1. 部署 Qdrant
  2. 对比 Qdrant vs Milvus 的 API 和性能
- **产出**：向量数据库对比报告
- **时间**：3-5 天

### Kubernetes 深入
- **当前水平**：部署过应用
- **目标**：掌握 Helm + Istio + HPA
- **学习路径**：
  1. Helm Chart 编写
  2. Istio 服务网格（流量管理、灰度发布）
  3. HPA 自动扩缩容
- **产出**：生产级 K8s 部署方案
- **时间**：2 周

### ClickHouse + Flink
- **当前水平**：未深入
- **目标**：了解实时数据分析栈
- **学习路径**：
  1. ClickHouse 表引擎（MergeTree 家族）
  2. Flink 流处理基础
  3. Kafka → Flink → ClickHouse 实时管道
- **产出**：实时数据分析 demo
- **时间**：2 周

### Next.js
- **当前水平**：用过 React
- **目标**：掌握 Next.js 全栈开发
- **学习路径**：
  1. App Router + Server Components
  2. API Routes / Server Actions
  3. 部署到 Vercel
- **产出**：一个 Next.js 全栈项目
- **时间**：1-2 周

### Terraform
- **当前水平**：未深入
- **目标**：掌握基础设施即代码
- **学习路径**：
  1. Terraform HCL 语法
  2. 编写 AWS/阿里云资源的 Terraform 配置
  3. 理解 State 管理
- **产出**：基础设施代码仓库
- **时间**：1 周

---

## P2 — 知识广度补充

### Stable Diffusion / Whisper
- **目标**：了解多模态模型部署
- **学习路径**：
  1. 部署 Stable Diffusion WebUI / ComfyUI
  2. 部署 Whisper 语音识别
  3. 了解多模态在 Agent 中的应用
- **时间**：1-2 周

### Three.js / WebGL
- **目标**：能开发 3D 可视化页面
- **学习路径**：
  1. Three.js 基础（场景、相机、渲染器）
  2. React Three Fiber 集成
  3. 实现一个 3D 数据可视化 demo
- **时间**：2 周

### Service Mesh (Istio)
- **目标**：理解服务网格架构
- **学习路径**：
  1. Istio 安装与配置
  2. 流量管理（VirtualService、DestinationRule）
  3. 灰度发布实操
- **时间**：1-2 周

### 安全 (OAuth2 / JWT / RBAC / Vault)
- **目标**：掌握企业级安全方案
- **学习路径**：
  1. OAuth2 四种模式
  2. JWT 最佳实践（刷新令牌、黑名单）
  3. RBAC 权限模型设计
  4. HashiCorp Vault 密钥管理
- **时间**：2 周

### 测试 (Jest / Cypress / Playwright / k6)
- **目标**：建立完整测试体系
- **学习路径**：
  1. Jest 单元测试 + 覆盖率
  2. Cypress/Playwright E2E 测试
  3. k6 压测脚本编写
- **时间**：1-2 周

### 数据管道 (Airflow / dbt)
- **目标**：了解数据工程基础
- **学习路径**：
  1. Airflow DAG 编写
  2. dbt 数据转换模型
  3. 构建一个小型 ETL 管道
- **时间**：1-2 周

---

## 学习时间规划

| 阶段 | 时间 | 重点 |
|---|---|---|
| 第 1-2 周 | P0 优先 | ADK、OpenAI SDK、vLLM 深入、Embedding+Reranker |
| 第 3-4 周 | P0 + P1 | Skills Protocol、量化微调、Spring Cloud、LangChain4j |
| 第 5-8 周 | P1 深入 | K8s 深入、Milvus/Qdrant、Next.js、Terraform |
| 第 9-12 周 | P2 广度 | 多模态、3D、安全、测试、数据管道 |

---

## 产出检查清单

- [ ] ADK Agent demo（多工具调用）
- [ ] OpenAI SDK Function Calling + Streaming 示例
- [ ] Skills Protocol 自定义 Skill
- [ ] RAG 检索质量对比（Embedding + Reranker）
- [ ] vLLM 量化部署 + 压测报告
- [ ] AWQ/GPTQ/LoRA 对比实验
- [ ] DeepSeek vs Qwen vs Claude 评测
- [ ] Spring Cloud 微服务 demo
- [ ] LangChain4j RAG demo
- [ ] Milvus 索引优化报告
- [ ] Qdrant vs Milvus 对比
- [ ] K8s Helm + Istio 部署方案
- [ ] ClickHouse + Flink 实时管道
- [ ] Next.js 全栈项目
- [ ] Terraform 基础设施代码
- [ ] Stable Diffusion / Whisper 部署
- [ ] Three.js 3D 可视化 demo
- [ ] OAuth2 + JWT + RBAC 安全方案
- [ ] Jest/Cypress/k6 测试体系
- [ ] Airflow + dbt ETL 管道
