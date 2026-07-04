#!/usr/bin/env bash
# PreToolUse-хук (Bash) — БЛОКИРУЕТ разрушительные команды (Урок 7, Задание 14).
# exit 2 = запрет (Claude видит причину в stderr и меняет план). Обычные команды
# не трогаем: паттерны узкие, чтобы не мешать работе (см. docs/automations.md).

input="$(cat 2>/dev/null || true)"
cmd="$(printf '%s' "$input" | grep -o '"command"[[:space:]]*:[[:space:]]*"' >/dev/null 2>&1 && printf '%s' "$input" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\(.*\)".*/\1/p' | head -1)"
[ -z "$cmd" ] && exit 0

block() { echo "⛔ pre-tool-use-bash: команда заблокирована — $1. Если это ОСОЗНАННО нужно — пусть пользователь выполнит руками (docs/automations.md)." >&2; exit 2; }

case "$cmd" in
  *"rm -rf /"*|*"rm -fr /"*|*"rm -rf ~"*|*'rm -rf $HOME'*)
    block "rm -rf по корню/домашней папке" ;;
  *"migrate reset"*)
    block "prisma migrate reset стирает базу (боевую — тем более); см. docs/rules/production-safety.md" ;;
  *"DROP DATABASE"*|*"drop database"*|*"DROP SCHEMA"*|*"TRUNCATE "*|*"truncate table"*)
    block "разрушительный SQL (DROP/TRUNCATE)" ;;
  *"push --force"*" main"*|*"push -f "*" main"*|*"push --force origin main"*)
    block "force-push в main переписывает общую историю" ;;
  *"killall node"*)
    block "killall node убьёт MCP-серверы чатов; безопасно: pkill -f \"next dev\"" ;;
esac

exit 0
