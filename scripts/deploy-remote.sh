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

echo "→ Заливаю код на $SERVER_IP (rsync)…"
rsync -az --delete \
  --exclude node_modules --exclude .next --exclude .git --exclude .gitignore \
  --exclude '.env' --exclude '.env.*' --exclude docs --exclude lessons \
  -e "ssh -i $KEY" \
  ./ "$SERVER_USER@$SERVER_IP:/var/www/axon-app/"

echo "→ Пересобираю и поднимаю контейнер на сервере…"
ssh -i "$KEY" "$SERVER_USER@$SERVER_IP" "bash /var/www/axon-app/deploy.sh"

echo "✅ Готово. Проверь: http://$SERVER_IP"
