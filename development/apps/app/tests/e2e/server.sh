#!/usr/bin/env bash
# Тестовый сервер для e2e: ПРОД-СБОРКА (standalone, как в Docker/на проде) на тестовой
# БД (.env.test → axon_test на Neon). Переменные .env.test экспортируются в окружение —
# они сильнее значений из .env (у Next process.env всегда в приоритете).
# Раскладка standalone зеркалит Dockerfile: server.js внутри apps/app/ (outputFileTracingRoot),
# static/public/prisma докопируются рядом — иначе сервер без стилей или падает на БД.
set -euo pipefail
cd "$(dirname "$0")/../.."

if [ ! -f .env.test ]; then
  echo "Нет .env.test — создай: DATABASE_URL (база axon_test), BETTER_AUTH_SECRET, BETTER_AUTH_URL=http://localhost:3101" >&2
  exit 1
fi

set -a; source .env.test; set +a
export OPENROUTER_API_KEY=""   # ИИ выключен: e2e детерминированы (fallback на правила)

npx next build

ST=".next/standalone"
rsync -a --delete .next/static/ "$ST/apps/app/.next/static/"
rsync -a --delete public/ "$ST/apps/app/public/"
# Prisma client + движок запроса (standalone не всегда их трейсит — как в Dockerfile).
mkdir -p "$ST/node_modules/@prisma"
rsync -a --delete ../../node_modules/.prisma/ "$ST/node_modules/.prisma/"
rsync -a --delete ../../node_modules/@prisma/client/ "$ST/node_modules/@prisma/client/"

PORT=3101 HOSTNAME=127.0.0.1 exec node "$ST/apps/app/server.js"
