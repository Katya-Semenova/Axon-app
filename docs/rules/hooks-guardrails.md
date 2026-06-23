# Хуки-страховки (guardrails)

Документация автоматических хуков Claude Code в этом репозитории. Хуки настроены в
`.claude/settings.json` (общие, в git). Скрипты — в `.claude/hooks/`.

---

## global-spec-reminder (PostToolUse)

**Зачем.** Второй слой страховки для `docs/screens/_global.md` (сквозные правила экранов).
Первый слой — железное правило №3 в `AGENTS.md` (смысл, грузится каждый промт); хук — гарантия
срабатывания на самих правках (не зависит от памяти модели).

**Когда срабатывает.** PostToolUse на `Edit | Write | MultiEdit`, если изменён файл под
`development/apps/app/app/` или `development/apps/landing/app/` (страницы/компоненты экранов).
На сам `_global.md` и на прочие файлы — молчит.

**Что делает.** Печатает короткое напоминание в stderr + добавляет `additionalContext`:
«сверься с `_global.md`; при расхождении сначала обнови `_global.md`, потом код».

**Анти-спам.** Маркер `.claude/.cache/global-spec-reminder` глушит повторы на ~10 минут.
Кэш в `.gitignore` (`.claude/.cache/`).

**Безопасность.** Скрипт `always exit 0` — никогда не падает и не блокирует инструменты
(в т.ч. при параллельной работе второго чата). Худший случай — просто не покажет напоминание.

**Файлы.** `.claude/hooks/global-spec-reminder.sh` + регистрация в `.claude/settings.json`
(массив `hooks.PostToolUse`).

**Как отключить.** Убрать блок из `hooks.PostToolUse` в `.claude/settings.json` (или весь файл).
