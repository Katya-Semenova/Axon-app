#!/usr/bin/env bash
# Security-precheck перед деплоем (Урок 7, Задание 14): быстрые проверки, что в
# выкатываемом коде нет секретов. Красный → деплой останавливается.
# Запускается из deploy-remote.sh; руками: bash scripts/security-precheck.sh
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

fail=0

# 1. В git не должно быть env-файлов кроме .env.example
bad_env="$(git ls-files | grep -E '(^|/)\.env' | grep -v '\.env\.example$' || true)"
if [ -n "$bad_env" ]; then
  echo "⛔ precheck: env-файлы с секретами в git:"; echo "$bad_env"; fail=1
fi

# 2. В отслеживаемых файлах — сигнатуры живых ключей (OpenRouter/AWS/приватные ключи)
leaks="$(git grep -I -l -E 'sk-or-v1-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}' -- . 2>/dev/null | grep -v 'security-precheck.sh' || true)"
if [ -n "$leaks" ]; then
  echo "⛔ precheck: похоже на живые API-ключи в git:"; echo "$leaks"; fail=1
fi
keys="$(git grep -I -l -- '-----BEGIN.*PRIVATE KEY' -- . 2>/dev/null | grep -v 'security-precheck.sh' || true)"
if [ -n "$keys" ]; then
  echo "⛔ precheck: приватные ключи в git:"; echo "$keys"; fail=1
fi

# 3. Незакоммиченные правки — деплой должен ехать из зафиксированного состояния
dirty="$(git status --porcelain | grep -v '^??' || true)"
if [ -n "$dirty" ]; then
  echo "⚠️  precheck (предупреждение): есть незакоммиченные правки — деплой поедет с ними:"
  echo "$dirty" | head -5
fi

if [ "$fail" = "1" ]; then
  echo "⛔ Security-precheck НЕ пройден — деплой остановлен. Убери секреты из git и повтори."
  exit 1
fi
echo "✅ Security-precheck пройден."
