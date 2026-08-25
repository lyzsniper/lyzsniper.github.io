#!/bin/bash
# 内容同步脚本 - 只推送不拉取，避免恢复已删除内容
# 每天检查并同步 content/published/ 变更到 GitHub

set -e

cd /home/jensen/lyzsniper.github.io

# 只添加 content 变更（不添加数据库）
git add content/

# 如果有变更则推送
if git diff --staged --quiet; then
    echo "$(date): No content changes, skipping"
else
    COMMIT_MSG="sync: content update $(date '+%Y-%m-%d %H:%M')"
    git commit -m "$COMMIT_MSG"
    GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND="ssh -o ConnectTimeout=20" git push origin master
    echo "$(date): Content synced successfully"
fi
