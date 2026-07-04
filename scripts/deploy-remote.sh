#!/usr/bin/env bash
# Деплой С MAC одной командой: залить свежий код на сервер (rsync) и пересобрать контейнер.
# Доступ к серверу читается из .env.deploy (SERVER_IP / SERVER_USER / SSH_KEY_PATH) —
# в чат/код ничего не хардкодим.
#
# Запуск:  ./scripts/deploy-remote.sh
set -euo pipefail

cd "$(dirname "$0")/.."

set -a; source .env.deploy; set +a
KEY="${SSH_KEY_PATH/#\~/$HOME}"

# Гейт тестов перед выкатом (Урок 7, Задание 5.1): красные тесты останавливают деплой
# ДО заливки кода на сервер. Пропуск РАЗОВО (осознанно): SKIP_TESTS=1 ./scripts/deploy-remote.sh
if [ "${SKIP_TESTS:-0}" != "1" ]; then
  echo "→ Гейт: прогоняю тесты перед выкатом (пропуск разово: SKIP_TESTS=1)…"
  # test:all = Vitest (быстрые) + Playwright e2e (браузерные, против прод-сборки
  # на тестовой БД; нужен apps/app/.env.test — см. docs/automations.md).
  (cd development && npm run test:all -w apps/app)
  echo "→ Гейт: тесты зелёные, продолжаю деплой."
fi

echo "→ Заливаю код на $SERVER_IP (rsync)…"
rsync -az --delete \
  --exclude node_modules --exclude .next --exclude .git --exclude .gitignore \
  --exclude '.env' --exclude '.env.*' --exclude docs --exclude lessons \
  -e "ssh -i $KEY" \
  ./ "$SERVER_USER@$SERVER_IP:/var/www/axon-app/"

echo "→ Пересобираю и поднимаю контейнер на сервере…"
ssh -i "$KEY" "$SERVER_USER@$SERVER_IP" "bash /var/www/axon-app/deploy.sh"

echo "✅ Готово. Проверь: http://$SERVER_IP"
