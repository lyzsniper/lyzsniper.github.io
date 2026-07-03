# 部署指南

> 刘酝泽的博客平台 —— 从代码到线上的一键部署

## 一、技术栈概览

| 组件      | 技术选型                       | 说明                     |
| --------- | ------------------------------ | ------------------------ |
| 前端      | React 18 + Vite + Tailwind CSS | 构建产物为静态文件       |
| 后端      | Fastify 5 + TypeScript         | Node.js API 服务         |
| 数据库    | SQLite（文件型）               | 零配置，无需独立 DB 服务 |
| 进程守护  | PM2                            | 后端服务常驻运行         |
| 反向代理  | Nginx                          | 静态托管 + API 反代      |
| 包管理器  | pnpm 9+                        | monorepo 工作区          |
| Node.js   | >= 20.18（推荐 22 LTS）        |                          |

---

## 二、服务器前置条件

购买一台 Linux 服务器（Ubuntu 22.04 / Debian 12 推荐），确保：

```bash
# 1. Node.js >= 20.18
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v22.x

# 2. pnpm
corepack enable
corepack prepare pnpm@9 --activate
pnpm -v   # 9.x

# 3. PM2（全局）
npm i -g pm2

# 4. Nginx
sudo apt install -y nginx
sudo systemctl enable nginx

# 5. Git
sudo apt install -y git
```

---

## 三、快速部署（一键脚本）

仓库已内置部署脚本，直接跑：

```bash
# 克隆到服务器
git clone https://github.com/lyzsniper/lyzsniper.github.io.git /opt/blog-platform
cd /opt/blog-platform

# 配置环境变量
cp .env.example .env
# 编辑 .env，至少改 COOKIE_SECRET 和 CORS_ORIGIN
vim .env

# 一键部署
chmod +x scripts/deploy.sh
DOMAIN=your-domain.com ./scripts/deploy.sh
```

脚本会自动完成：拉取代码 → 安装依赖 → 数据库迁移 → 构建前端 → PM2 启动后端 → Nginx 生效。

---

## 四、手动部署步骤（便于排查问题）

如果想逐步执行或排查问题，按下面顺序操作：

### 4.1 拉取代码

```bash
cd /opt/blog-platform
git pull --rebase
```

### 4.2 安装依赖

```bash
pnpm install --frozen-lockfile
```

### 4.3 配置环境变量

编辑 `/opt/blog-platform/.env`（参考 `.env.example`），**必须修改**的字段：

| 变量            | 说明                              | 示例                              |
| --------------- | --------------------------------- | --------------------------------- |
| `COOKIE.secret` | 会话签名密钥（随机长字符串）      | `openssl rand -hex 32` 生成       |
| `CORS_ORIGIN`   | 前端域名                          | `https://blog.example.com`        |
| `DB_PATH`       | SQLite 数据库路径                 | `/opt/blog-platform/data/blog.db` |
| `PORT`          | 后端端口                          | `4000`                            |
| `NODE_ENV`      | `production`                      | `production`                      |

### 4.4 数据库迁移与初始数据

```bash
pnpm --filter @blog/api migrate          # 建表
pnpm --filter @blog/api seed             # 拉取历史博客内容（可选）
pnpm --filter @blog/api seed-admin       # 创建管理员账号
```

### 4.5 构建前端

```bash
pnpm --filter @blog/web build
# 产物输出到 apps/web/dist/
```

### 4.6 启动后端（PM2）

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup    # 让 PM2 随系统自启（按提示执行输出的 sudo 命令）
```

PM2 配置要点（见 `ecosystem.config.cjs`）：

- 入口：`apps/api/dist/server.js`（需先 `pnpm --filter @blog/api build` 编译 TS）
- 监听：`127.0.0.1:4000`（仅本地，由 Nginx 反代对外）
- 日志：`logs/api-out.log`、`logs/api-error.log`
- 内存超 512M 自动重启

> ⚠️ 注意：PM2 配置里 script 指向编译后的 `dist/server.js`，首次部署需先跑一次 `pnpm --filter @blog/api build`，否则找不到文件。

### 4.7 配置 Nginx

复制并调整模板：

```bash
sudo sed "s/blog.example.com/你的域名/g" deploy/nginx.conf | \
  sudo tee /etc/nginx/sites-available/blog.conf
sudo ln -sf /etc/nginx/sites-available/blog.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

配置做了什么：
- 静态文件直接从 `apps/web/dist/` 读取（含长缓存）
- SPA fallback 到 `index.html`
- `/api/` 反代到 `127.0.0.1:4000`
- 安全响应头 + gzip

### 4.8 HTTPS（生产必备）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Certbot 会自动修改 Nginx 配置并续期。

---

## 五、验证部署

```bash
# 1. API 健康检查
curl https://your-domain.com/api/healthz
# 期望返回：{"status":"ok"}

# 2. 前端打开
浏览器访问 https://your-domain.com/

# 3. 后端 PM2 状态
pm2 status
pm2 logs blog-api
```

---

## 六、日常运维

### 更新代码

```bash
cd /opt/blog-platform
git pull --rebase
pnpm install --frozen-lockfile
pnpm --filter @blog/api build     # TS 编译后端
pnpm --filter @blog/web build     # 前端
pm2 restart blog-api
```

或者直接执行：
```bash
DOMAIN=your-domain.com ./scripts/deploy.sh
```

### 备份数据

核心数据只需备份两样：

```bash
# 数据库
cp /opt/blog-platform/data/blog.db /backup/blog-$(date +%F).db

# 上传的图片等
rsync -a /opt/blog-platform/data/uploads/ /backup/uploads/
```

`.gitignore` 已确保 `data/blog.db` 和 `node_modules`、`dist` 不会被提交，本地重建即可，**必须人工备份数据库文件**。

### 查看日志

```bash
pm2 logs blog-api           # 实时
tail -f logs/api-out.log    # 全部
tail -f logs/api-error.log  # 仅错误
```

### 常用 PM2 命令

```bash
pm2 status                  # 查看进程
pm2 restart blog-api        # 重启
pm2 stop blog-api           # 停止
pm2 delete blog-api         # 删除
pm2 monit                   # 资源面板
```

---

## 七、目录结构速查

```
/opt/blog-platform/
├── apps/
│   ├── api/                # Fastify 后端
│   │   ├── dist/server.js  # PM2 启动入口（编译产物）
│   │   └── src/            # TypeScript 源码
│   └── web/                # React 前端
│       └── dist/           # Nginx 静态托管（构建产物）
├── data/
│   ├── blog.db             # SQLite 数据库（需备份）
│   └── uploads/            # 上传文件（需备份）
├── content/                # Markdown 博客内容
├── deploy/nginx.conf       # Nginx 配置模板
├── scripts/deploy.sh       # 一键部署脚本
├── ecosystem.config.cjs    # PM2 配置
├── .env                    # 环境变量（不入库）
└── logs/                   # PM2 日志
```

---

## 八、常见问题

| 问题                          | 排查命令                                       |
| ----------------------------- | ---------------------------------------------- |
| PM2 进程不存在                | `pm2 status`                                   |
| 后端启动失败（找不到 dist）    | 先跑 `pnpm --filter @blog/api build`            |
| 前端空白 / 404                | `apps/web/dist/index.html` 是否存在            |
| API 返回 502                  | 后端没起来：`pm2 logs blog-api`                |
| 数据库锁定                    | 检查是否有残留进程：`fuse data/blog.db`         |
| Nginx 配置错误                | `sudo nginx -t`                                |
| 上传失败（文件过大）           | 调整 nginx `client_max_body_size`              |
| .env 修改后不生效              | `pm2 restart blog-api`（环境变量启动时注入）    |

---

## 九、架构示意图

```
┌──────────┐
│  浏览器   │
└────┬─────┘
     │ HTTPS
┌────▼─────┐
│  Nginx    │  静态文件 + 反代
│  443/80   │
├────┬─────┤
│    │     │
│    │ /api ─────────►  Fastify (127.0.0.1:4000)  ──► SQLite
│    │                   PM2 守护
│    └──────────────►  apps/web/dist/ (静态)
│
└── 域名: your-domain.com ──┘
```

---

**极简版(checklist)：**

- [ ] Node 22 + pnpm 9 + PM2 + Nginx 全部装好
- [ ] `git clone` 到 `/opt/blog-platform`
- [ ] 复制 `.env.example` → `.env` 并改 `COOKIE_SECRET`
- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm --filter @blog/api build`（编译后端）
- [ ] `pnpm --filter @blog/api migrate`
- [ ] `pnpm --filter @blog/web build`
- [ ] `pm2 start ecosystem.config.cjs --env production && pm2 save && pm2 startup`
- [ ] Nginx 替换域名 → `sites-enabled` → `nginx -t && systemctl reload nginx`
- [ ] `certbot --nginx -d 域名`
- [ ] 浏览器打开验证 `https://域名/api/healthz`
