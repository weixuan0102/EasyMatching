#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# 嘗試從 .env 讀取 DATABASE_URL
if [ -f .env ]; then
  # 簡單讀取 .env 中的 DATABASE_URL (不處理複雜情況)
  ENV_DB_URL=$(grep '^DATABASE_URL=' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

MONGO_URI="${ENV_DB_URL:-mongodb://127.0.0.1:27017/EasyMatching}"

command -v yarn >/dev/null 2>&1 || {
  echo "❌ 無法找到 yarn 指令，請先安裝 Yarn。" >&2
  exit 1
}

echo "ℹ️  MongoDB 設定為 Docker 模式"
echo "ℹ️  連線位置：$MONGO_URI"
echo "⚠️  請確保您的 Docker MongoDB 容器已經啟動並可供連線"

echo "📦 同步 Prisma schema..."
yarn prisma:push

echo "🌱 匯入預設興趣種子資料..."
yarn prisma:seed

echo "▶️ 啟動 Next.js 開發伺服器..."
yarn dev
