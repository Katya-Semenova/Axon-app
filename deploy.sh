#!/usr/bin/env bash
# Деплой НА СЕРВЕРЕ: пересобрать и поднять контейнер. Запускается на VPS.
# Обычно вызывается автоматически из scripts/deploy-remote.sh (с Mac).
set -euo pipefail
cd /var/www/axon-app

docker compose up -d --build

# Пост-деплой гигиена (важно на слабом боксе 1 ГБ):
# кэш сборок Docker растёт быстро — чистим, чтобы не забить диск.
docker builder prune -f >/dev/null 2>&1 || true

echo "Deployed at $(date)"
