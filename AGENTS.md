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

## Правила (читать по триггеру)

| Когда | Файл |
|---|---|
| Перед коммитом | `docs/rules/commits.md` *(появится на следующих уроках)* |
| Деплой / инфра | `docs/memory/infrastructure.md` *(появится на следующих уроках)* |

## Активная работа
См. `docs/memory/state.md` *(появится на следующих уроках)*.
Текущий рабочий журнал и статус задач — пока в `CLAUDE.md`.

## История решений
См. `docs/memory/INDEX.md` (ADR, findings, sessions) *(появится на следующих уроках)*.
