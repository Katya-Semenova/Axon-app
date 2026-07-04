#!/usr/bin/env bash
# PreToolUse-хук (Read): при чтении файла кода подсказывает релевантные ADR
# из docs/decisions/INDEX.md (по словам из имени файла). Только подсказка,
# ничего не блокирует. НИКОГДА не падает (always exit 0). Глушилка ~10 минут.
# Реестр всех автоматизаций и как временно отключить: docs/automations.md.

input="$(cat 2>/dev/null || true)"

file="$(printf '%s' "$input" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')"
[ -z "$file" ] && exit 0

# Подсказываем только при чтении кода сервиса (не доков — там ADR и так рядом).
case "$file" in
  *"/development/apps/app/"*) : ;;
  *) exit 0 ;;
esac

ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
INDEX="$ROOT/docs/decisions/INDEX.md"
[ -f "$INDEX" ] || exit 0

# Глушилка: не чаще раза в ~10 минут (Read зовётся очень часто).
dir="$ROOT/.claude/.cache"
mkdir -p "$dir" 2>/dev/null || true
marker="$dir/pre-read-suggest"
now="$(date +%s 2>/dev/null || echo 0)"
if [ -f "$marker" ]; then
  m="$(stat -f %m "$marker" 2>/dev/null || stat -c %Y "$marker" 2>/dev/null || echo 0)"
  [ $(( now - m )) -lt 600 ] && exit 0
fi

# Ключевые слова из имени файла (auth.ts → auth; ai-plan.ts → plan).
base="$(basename "$file" | sed 's/\.[^.]*$//' | tr '[:upper:]' '[:lower:]' | tr '_.-' '   ')"

matches=""
for kw in $base; do
  [ ${#kw} -lt 4 ] && continue
  # Стоп-слова — общие имена файлов, дают ложные подсказки.
  case "$kw" in
    page|route|layout|index|types|utils|store|component|components) continue ;;
  esac
  found="$(grep -i "$kw" "$INDEX" 2>/dev/null | grep 'ADR-' | head -2)"
  [ -n "$found" ] && matches="$matches$found
"
done

[ -z "$matches" ] && exit 0
touch "$marker" 2>/dev/null || true

{
  echo "💡 pre-read-suggest: для $file есть возможно релевантные ADR (docs/decisions/):"
  printf '%s' "$matches" | head -4
} >&2

exit 0
