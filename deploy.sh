#!/usr/bin/env bash
# Деплой НА СЕРВЕРЕ: пересобрать и поднять контейнер. Запускается на VPS.
# Обычно вызывается автоматически из scripts/deploy-remote.sh (с Mac).
set -euo pipefail
cd /var/www/axon-app

docker compose --env-file .env.production up -d --build

# Применить миграции БД (одноразовый node-контейнер на сети compose; пароль из .env.production).
# TODO (оптимизация): встроить prisma в образ web и звать `docker compose exec web npx prisma migrate deploy`.
docker run --rm --network axon-app_default --env-file .env.production \
  -v /var/www/axon-app/prisma:/app/prisma -w /app \
  node:20-slim sh -lc 'npx -y prisma@6.19.3 migrate deploy --schema=prisma/schema.prisma'

# Пост-деплой гигиена (важно на слабом боксе 1 ГБ):
# кэш сборок Docker растёт быстро — чистим, чтобы не забить диск.
docker builder prune -f >/dev/null 2>&1 || true

echo "Deployed at $(date)"
