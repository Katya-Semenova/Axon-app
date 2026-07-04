#!/usr/bin/env bash
# PreToolUse-хук (Edit|Write) — БЛОКИРУЕТ запись секретов (Урок 7, Задание 14).
# exit 2 = запрет. Правила: (1) .env.production не редактируем инструментами —
# боевые секреты меняются руками на сервере; (2) приватные ключи и живые API-ключи
# не пишем в файлы, которые попадут в git (.env* в .gitignore — туда можно).

input="$(cat 2>/dev/null || true)"
file="$(printf '%s' "$input" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')"
[ -z "$file" ] && exit 0

case "$file" in
  *.env.production)
    echo "⛔ pre-tool-use-write: .env.production — боевые секреты, правим только руками на сервере (docs/memory/infrastructure.md)." >&2
    exit 2 ;;
esac

# Файлы-детекторы (хуки и пречек) ЛЕГАЛЬНО содержат сигнатуры как шаблоны поиска —
# их правку не блокируем, иначе хук ловит сам себя (замечание чата графиков 04.07).
case "$file" in
  */.claude/hooks/*|*scripts/security-precheck.sh) exit 0 ;;
esac

# Содержимое (для Write — content, для Edit — new_string). Ищем секреты по сигнатурам.
body="$(printf '%s' "$input" | sed -nE 's/.*"(content|new_string)"[[:space:]]*:[[:space:]]*"(.*)".*/\2/p' | head -1)"
[ -z "$body" ] && exit 0

is_env_file=0
case "$file" in *.env|*.env.*) is_env_file=1 ;; esac

if printf '%s' "$body" | grep -q -- "-----BEGIN.*PRIVATE KEY"; then
  echo "⛔ pre-tool-use-write: похоже на приватный ключ — в файлы проекта не пишем (ключи живут вне git)." >&2
  exit 2
fi
if [ "$is_env_file" = "0" ] && printf '%s' "$body" | grep -qE "sk-or-v1-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}"; then
  echo "⛔ pre-tool-use-write: похоже на живой API-ключ вне .env* — ключам место только в .env (gitignored)." >&2
  exit 2
fi

exit 0
