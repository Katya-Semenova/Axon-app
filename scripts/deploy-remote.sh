#!/usr/bin/env bash
# Деплой С MAC одной командой: залить свежий код на сервер (rsync) и пересобрать контейнер.
# Доступ к серверу читается из .env.deploy (SERVER_IP / SERVER_USER / SSH_KEY_PATH) —
# в чат/код ничего не хардкодим.
#
# Запуск:  ./scripts/deploy-remote.sh
set -euo pipefail

# ⛔ СТОП-КРАН (Урок 6, Шаг 0 — монорепо-переезд, 2026-06-20).
# Код переехал в development/apps/app — пути этого скрипта (rsync) и серверного
# deploy.sh ещё не обновлены. Публикация временно ОТКЛЮЧЕНА: чиним и проверяем
# вживую в Шаге 1. Подробности — docs/memory/infrastructure.md → «Деплой (монорепо)».
echo "⛔ Деплой отключён: монорепо-переезд (Шаг 0). Рецепт чинится в Шаге 1 — см. docs/memory/infrastructure.md" >&2
exit 1

cd "$(dirname "$0")/.."

set -a; source .env.deploy; set +a
KEY="${SSH_KEY_PATH/#\~/$HOME}"

echo "→ Заливаю код на $SERVER_IP (rsync)…"
rsync -az --delete \
  --exclude node_modules --exclude .next --exclude .git --exclude .gitignore \
  --exclude '.env' --exclude '.env.*' --exclude docs --exclude lessons \
  -e "ssh -i $KEY" \
  ./ "$SERVER_USER@$SERVER_IP:/var/www/axon-app/"

echo "→ Пересобираю и поднимаю контейнер на сервере…"
ssh -i "$KEY" "$SERVER_USER@$SERVER_IP" "bash /var/www/axon-app/deploy.sh"

echo "✅ Готово. Проверь: http://$SERVER_IP"
