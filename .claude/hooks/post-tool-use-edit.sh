#!/usr/bin/env bash
# PostToolUse-хук: grep на хардкод после правки UI-файла сервиса.
# (1) хардкод стилей — хексы (#abc) и произвольные пиксели ([16px]) мимо токенов DESIGN.md;
# (2) хардкод данных — mock/dummy/fixture-переменные и инлайн-массивы объектов.
# Только ПРЕДУПРЕЖДАЕТ (PostToolUse не может откатить правку). НИКОГДА не падает (always exit 0).
# Реестр всех автоматизаций и как временно отключить: docs/automations.md.

input="$(cat 2>/dev/null || true)"

# Путь отредактированного файла (без jq — простым grep, как в global-spec-reminder.sh).
file="$(printf '%s' "$input" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')"
[ -z "$file" ] && exit 0
[ -f "$file" ] || exit 0

# Зона проверки: UI сервиса (страницы/компоненты). Лендинг НЕ проверяем —
# его палитра захардкожена inline осознанно (см. docs/memory/state.md, Урок 6).
case "$file" in
  *"/development/apps/app/app/"*.tsx|*"/development/apps/app/app/"*.ts) : ;;
  *) exit 0 ;;
esac

# Исключения — файлы, где хексы легальны (палитры/темы графиков в константах):
case "$file" in
  *ChartRenderer.tsx|*MiniChart.tsx|*ChartFill.tsx) exit 0 ;;
esac

warned=0

# 1) Дизайн-хардкод: хексы и произвольные пиксели в обход токенов DESIGN.md.
hits="$(grep -nE '#[0-9a-fA-F]{3,8}\b|\[[0-9]+px\]' "$file" 2>/dev/null | head -5)"
if [ -n "$hits" ]; then
  warned=1
  {
    echo "⚠️  post-tool-use-edit: в $file найден хардкод стилей (хексы/пиксели мимо DESIGN.md):"
    echo "$hits"
    echo "   Правило: docs/rules/design-system-first.md — токен в DESIGN.md → компонент в app/components/ui/ → экран."
  } >&2
fi

# 2) Хардкод данных: mock/dummy/fixture-переменные (эвристика; статика — опции, тексты — ок).
# lib/mockData.ts — осознанный seed холста, но он не под app/, сюда не попадает.
hits2="$(grep -nE 'const +(mock|dummy|fake|sample|fixture|placeholder)[A-Za-z0-9_]*' "$file" 2>/dev/null | head -5)"
if [ -n "$hits2" ]; then
  warned=1
  {
    echo "⚠️  post-tool-use-edit: в $file похоже на захардкоженные данные (mock/dummy/fixture):"
    echo "$hits2"
    echo "   Продуктовые данные должны идти из БД/стора, не лежать в компоненте (эвристика — статику можно)."
  } >&2
fi

if [ "$warned" = "1" ]; then
  printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"В отредактированном UI-файле найден возможный хардкод (стили мимо токенов DESIGN.md или инлайн-моки). Проверь предупреждение выше: либо переведи на токены/компоненты ui/, либо убедись, что это легальная статика. Правила: docs/rules/design-system-first.md, docs/rules/ui-components-first.md."}}'
fi

exit 0
