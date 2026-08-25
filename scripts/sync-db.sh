#!/bin/bash
# 同步 SQLite 数据库到 GitHub
# 每 2 天通过 cron 执行

set -e

cd /home/jensen/lyzsniper.github.io

# 添加数据库变更
git add -f data/blog.db

# 如果有变更则提交并推送
if git diff --staged --quiet; then
    echo "No changes to database, skipping"
else
    COMMIT_MSG="chore: backup database $(date '+%Y-%m-%d %H:%M')"
    git commit -m "$COMMIT_MSG"
    GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND="ssh -o ConnectTimeout=20" git push origin master
    echo "Database synced successfully"
fi
