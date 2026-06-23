#!/usr/bin/env bash
# PostToolUse-хук: мягкое напоминание сверяться с docs/screens/_global.md
# при правке файлов экранов/компонентов. НИКОГДА не падает (always exit 0),
# чтобы не мешать инструментам и соседнему чату. Глушилка ~10 минут.

input="$(cat 2>/dev/null || true)"

# Путь отредактированного файла (без jq — простым grep).
file="$(printf '%s' "$input" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')"
[ -z "$file" ] && exit 0

# Реагируем только на UI-файлы сервиса/лендинга (страницы и компоненты экранов).
case "$file" in
  *"/development/apps/app/app/"*|*"/development/apps/landing/app/"*) : ;;
  *) exit 0 ;;
esac
# Не реагируем на сам _global.md.
case "$file" in *_global.md) exit 0 ;; esac

# Глушилка: не спамить чаще раза в ~10 минут.
dir="${CLAUDE_PROJECT_DIR:-$PWD}/.claude/.cache"
mkdir -p "$dir" 2>/dev/null || true
marker="$dir/global-spec-reminder"
now="$(date +%s 2>/dev/null || echo 0)"
if [ -f "$marker" ]; then
  m="$(stat -f %m "$marker" 2>/dev/null || stat -c %Y "$marker" 2>/dev/null || echo 0)"
  [ $(( now - m )) -lt 600 ] && exit 0
fi
touch "$marker" 2>/dev/null || true

echo "↳ Правишь экран/компонент — сверься с docs/screens/_global.md (сквозные правила)." >&2
printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"Изменён файл экрана/компонента. Сверься с docs/screens/_global.md (auth guard, роли, ошибки сети, сообщения об успехе, loading, защита от двойного submit, формат дат, i18n, empty states, basePath). При расхождении сначала обнови _global.md, потом код."}}'
exit 0
