#!/usr/bin/env bash
# Деплой НА СЕРВЕРЕ: пересобрать и поднять контейнер. Запускается на VPS.
# Обычно вызывается автоматически из scripts/deploy-remote.sh (с Mac).
set -euo pipefail

# ⛔ СТОП-КРАН (Урок 6, Шаг 0 — монорепо-переезд, 2026-06-20).
# Код переехал в development/apps/app, а этот рецепт всё ещё на старых путях.
# Публикация временно ОТКЛЮЧЕНА: рецепт деплоя чиним и проверяем вживую в Шаге 1.
# Подробности — docs/memory/infrastructure.md → «Деплой (монорепо)».
# Снять стоп-кран = удалить этот блок (после починки рецепта в Шаге 1).
echo "⛔ Деплой отключён: монорепо-переезд (Шаг 0). Рецепт публикации чинится в Шаге 1." >&2
exit 1

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
