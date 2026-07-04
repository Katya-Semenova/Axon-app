#!/usr/bin/env bash
# Чекер индексации библиотеки модулей (Урок 7, Задание 7): каждый промт в
# modules/*/prompts/*.md должен быть прописан в modules/_INDEX.md — иначе AI его
# никогда не найдёт («слепой» промт). Красный → допиши строку в _INDEX.md.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

INDEX="modules/_INDEX.md"
[ -f "$INDEX" ] || { echo "⛔ Нет $INDEX"; exit 1; }

missing=0
while IFS= read -r f; do
  rel="${f#modules/}"
  if ! grep -qF "$rel" "$INDEX"; then
    [ "$missing" = "0" ] && echo "⛔ Промты БЕЗ строки в $INDEX («слепые»):"
    echo "   $rel"
    missing=1
  fi
done < <(find modules -path "*/prompts/*.md" -type f | sort)

if [ "$missing" = "1" ]; then
  echo "Допиши каждую строку в $INDEX (раздел модуля) и повтори."
  exit 1
fi
echo "✅ Индексация модулей полная: все промты видны в $INDEX."
