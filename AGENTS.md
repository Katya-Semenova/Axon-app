# AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->
> **This is NOT the Next.js you know.** This version has breaking changes — APIs, conventions, and file structure may differ from training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Контекст продукта
См. `docs/spec.md → ## Продукт` (заполняется на промте `02-product-context.md`).
Здесь не дублируем — один источник правды.

## Железные правила — всегда, без исключений

### 1. spec.md всегда актуален
Любое изменение поведения продукта (логика, состояния, действия, данные, доступы) →
сначала обновить `docs/spec.md`, потом менять код.
Коммит без обновления spec.md считается незавершённым.

### 2. DESIGN.md → UIKit → Экран
Любое визуальное изменение идёт строго в одном направлении:
`docs/DESIGN.md` → `app/components/ui/` → страницы / виджеты / фичи.
Нужен новый токен (цвет, шрифт, отступ) → сначала в DESIGN.md.
Нужен новый вариант компонента → сначала в `app/components/ui/`, потом использовать.
Хардкод хексов, пикселей, inline-стилей на странице — запрещён.

### 3. Сквозные правила экранов — `docs/screens/_global.md`
При создании/изменении любого экрана или фичи — сначала прочитай `docs/screens/_global.md`
и соблюдай сквозные правила (auth guard, роли, ошибки сети, сообщения об успехе, loading,
защита от двойного submit, формат дат, i18n, empty states, basePath). Меняется само сквозное
правило → правь `_global.md` в ТОМ ЖЕ коммите. Паспорт конкретного экрана — `docs/screens/<screen>.md`.

## Правила (читать по триггеру)

| Когда | Файл |
|---|---|
| UI: страницы / компоненты / стили (запрет хардкода) | `docs/rules/ui-components-first.md` |
| DESIGN.md / токены / новый цвет или шрифт | `docs/rules/design-system-first.md` |
| Правка экрана или поведения (перед изменением логики) | `docs/rules/spec-first.md` |
| Перед «готово» / перед коммитом (что проверить) | `docs/rules/verification.md` |
| Завершил шаг → коммит (как коммитить; push — за пользователем) | `docs/rules/commits.md` |
| Старт/конец сессии, сохранение прогресса | `docs/rules/session-continuity.md` |
| Хуки-страховки (как устроены, как добавить свой) | `docs/rules/hooks-guardrails.md` |
| Все автоматизации: что срабатывает само и как отключить | `docs/automations.md` |
| Запуск dev-сервера / автотестов локально | `docs/rules/dev-server.md` |
| Деплой / инфра | `docs/memory/infrastructure.md` |

## Активная работа
См. `docs/memory/state.md` (текущий этап) и `docs/decisions/sessions/` (журнал сессий).
Детальный статус задач Урока 4 — пока в `CLAUDE.md`.

## История решений
См. `docs/decisions/INDEX.md` (оглавление ADR + журнал сессий; findings — позже).
