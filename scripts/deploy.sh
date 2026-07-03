#!/usr/bin/env bash
# 一键部署脚本（自有 Linux 服务器）
# 用法：
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh                  # 部署到生产
#   ./scripts/deploy.sh --seed           # 部署并 seed 历史数据
#   DOMAIN=blog.example.com ./scripts/deploy.sh
#
# 前置条件：
#   - Node.js >= 24（用户环境）
#   - pnpm >= 9
#   - PM2 全局安装：npm i -g pm2
#   - Nginx 已装好

set -euo pipefail

# 配置
APP_ROOT="${APP_ROOT:-/opt/blog-platform}"
DOMAIN="${DOMAIN:-blog.example.com}"
NGINX_CONF_SRC="$(dirname "$0")/../deploy/nginx.conf"
NGINX_CONF_DST="/etc/nginx/sites-available/blog.conf"
SEED="${1:-}"

cd "$(dirname "$0")/.."

echo "=== 1. 同步代码 ==="
if [ -d "$APP_ROOT/.git" ]; then
    git -C "$APP_ROOT" pull --rebase
else
    echo "请先 git clone $APP_ROOT"
    exit 1
fi

cd "$APP_ROOT"

echo "=== 2. 安装依赖 ==="
pnpm install --frozen-lockfile

echo "=== 3. 数据库迁移 + seed ==="
pnpm --filter @blog/api migrate
if [ "$SEED" = "--seed" ]; then
    pnpm --filter @blog/api seed
fi

echo "=== 4. 构建前端 ==="
pnpm --filter @blog/web build

echo "=== 5. 启动后端（PM2）==="
pm2 startOrRestart ecosystem.config.cjs --env production
pm2 save

echo "=== 6. 配置 Nginx ==="
if [ -f "$NGINX_CONF_SRC" ]; then
    sudo sed "s/blog.example.com/$DOMAIN/g" "$NGINX_CONF_SRC" | sudo tee "$NGINX_CONF_DST" > /dev/null
    sudo ln -sf "$NGINX_CONF_DST" /etc/nginx/sites-enabled/blog.conf
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ Nginx 已配置: $NGINX_CONF_DST"
else
    echo "⚠️ 未找到 Nginx 配置模板，跳过"
fi

echo ""
echo "=== 部署完成 ==="
echo "API:   http://$DOMAIN/api/healthz"
echo "前端:  http://$DOMAIN/"
echo "RSS:   http://$DOMAIN/api/feed.xml"
echo ""
echo "下一步："
echo "  - 配置 HTTPS（certbot --nginx -d $DOMAIN）"
echo "  - 访问 http://$DOMAIN/admin 配置博客"
echo "  - 外部 agent 推送：POST http://$DOMAIN/api/agent/publish"
