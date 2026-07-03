# Decisions

> 关键决策记录。说明 why 选了什么、放弃了什么。

## D1. 文件 + DB 混合存储
- 博客本体 = `.md` 文件（版本控制友好、备份简单）
- 元数据 = SQLite（列表/搜索/分页/标签快）
- 启动时扫描 `content/published/` 同步 DB，二者互为冗余

## D2. 外部 agent 接入口子 = `POST /api/agent/publish`
- 不做内部定时拉取（用户会自己用 hermes agent 推）
- 接口接受 JSON（base64 content）或 multipart
- 走与 inbox 相同的处理流水线

## D3. 无鉴权 v1
- 用户确认 Q4 不要鉴权
- 部署时建议 Nginx 限 IP 或 basic auth 兜底
- 代码里留 `auth middleware hook` 便于后续接入

## D4. 个人主页默认保留 neon 风
- 用户 Q3 未明确答，按 A 处理：复刻为 React 组件
- 如要重做请告知

## D5. 全 TypeScript / Node.js，零 Python
- PDF 导出用 `puppeteer-core` + 系统 Chromium
- 不用 Python 系的 wkhtmltopdf / weasyprint
