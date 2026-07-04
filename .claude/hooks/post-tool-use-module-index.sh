#!/usr/bin/env bash
# PostToolUse-хук: записали промт в modules/ — напомнить про строку в _INDEX.md,
# если её ещё нет («слепой» промт AI не найдёт). Только предупреждает. Always exit 0.

input="$(cat 2>/dev/null || true)"
file="$(printf '%s' "$input" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')"
[ -z "$file" ] && exit 0

case "$file" in
  */modules/*/prompts/*.md) : ;;
  *) exit 0 ;;
esac

ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
INDEX="$ROOT/modules/_INDEX.md"
[ -f "$INDEX" ] || exit 0

rel="${file#*"/modules/"}"
if ! grep -qF "$rel" "$INDEX" 2>/dev/null; then
  echo "⚠️  module-index: $rel не прописан в modules/_INDEX.md — промт «слепой», AI его не найдёт. Добавь строку (проверка: bash scripts/check-modules-indexed.sh)." >&2
fi
exit 0
