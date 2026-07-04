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

---

## post-tool-use-edit (PostToolUse)

**Зачем.** Детерминированная страховка от хардкода, когда AI «забывает» правила
`design-system-first`/`ui-components-first` в шуме длинной сессии. Второй слой после самих правил.

**Когда срабатывает.** PostToolUse на `Edit | Write | MultiEdit`, если изменён `.ts/.tsx`
под `development/apps/app/app/`. **Исключения:** `ChartRenderer.tsx`, `MiniChart.tsx`,
`ChartFill.tsx` (там хексы легальны — палитры/темы графиков в константах) и весь лендинг
(его палитра захардкожена inline осознанно, см. `docs/memory/state.md`, Урок 6).

**Что делает.** Два grep-а: (1) хардкод стилей — хексы `#abc` и произвольные пиксели `[16px]`
мимо токенов DESIGN.md; (2) хардкод данных — переменные `mock/dummy/fake/sample/fixture/placeholder`
(эвристика: статика — опции селекта, навигация, тексты — допустима). Найдено → warning в stderr
(до 5 строк на проверку) + `additionalContext` с отсылкой к правилам. **Не блокирует** —
PostToolUse не может откатить правку; смысл — чтобы AI сам исправил по горячим следам.

**Безопасность.** `always exit 0`, глушилки нет (предупреждение адресное, по конкретным строкам).

**Файлы.** `.claude/hooks/post-tool-use-edit.sh` + регистрация в `.claude/settings.json`
(второй элемент массива `hooks.PostToolUse` — добавлен К существующему, не вместо).

**Как отключить.** Убрать его блок из `hooks.PostToolUse` в `.claude/settings.json`.

---

## pre-read-suggest (PreToolUse: Read)

**Зачем.** Подсказывать прошлые архитектурные решения (ADR) в момент, когда AI читает
связанный код — чтобы решения из `docs/decisions/` не терялись между сессиями.

**Когда срабатывает.** PreToolUse на `Read`, если читается файл под `development/apps/app/`
(код сервиса). Доки не триггерят — там ADR и так рядом.

**Что делает.** Разбирает имя файла на слова (`auth.ts` → «auth»), ищет их в
`docs/decisions/INDEX.md` и печатает до 4 строк совпавших ADR в stderr. Эвристика по именам —
может дать нерелевантную подсказку; это нормально: лишняя подсказка лучше пропущенного ADR.
Стоп-слова (`page`, `route`, `layout`, `index`, `types`, `utils`, `store`, `component(s)`) отсечены.

**Анти-спам.** Маркер `.claude/.cache/pre-read-suggest` глушит повторы на ~10 минут
(Read зовётся очень часто).

**Безопасность.** `always exit 0`, ничего не блокирует.

**Файлы.** `.claude/hooks/pre-read-suggest.sh` + регистрация в `.claude/settings.json`
(массив `hooks.PreToolUse`, matcher `Read`).

**Как отключить.** Убрать его блок из `hooks.PreToolUse` в `.claude/settings.json`.
