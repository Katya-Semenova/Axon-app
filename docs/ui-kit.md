# UI-кит Axon

Источник визуальной правды для примитивов. Все компоненты — на токенах [DESIGN.md](DESIGN.md), без хардкод-хексов. Витрина: `/storybook` → группа **UI KIT**.

> **Подход (Урок 2, безопасный гибрид):** кит собран как **новые** компоненты рядом с существующим кодом. Старые экраны не тронуты и работают как есть. Перевод экранов на кит — поэтапно, позже (см. «Миграция»). Прод не затрагивается до осознанного деплоя (Урок 3).

## Компоненты (в `app/components/ui/`)

| Компонент | Тип | Варианты / состояния |
|---|---|---|
| `Button` | atom | variant: primary/secondary/outline/ghost/destructive/link · size: sm/md/lg/icon · loading · left/rightIcon |
| `Input` | atom | inputSize: sm/md/lg · invalid · disabled (focus — золотой ring) |
| `Textarea` | atom | invalid · disabled · rows |
| `Label` | atom | required (золотая звёздочка) |
| `Badge` | atom | default/outline/success/warning/error/info/**beta** · size: sm/md (uppercase статусы) |
| `Chip` | atom | строчный тег/метка с иконкой (имена файлов, источники) — НЕ uppercase |
| `BackButton` | atom | голая текст-ссылка «назад» с шевроном (mono, без фона/паддинга) |
| `Modal` | organism | диалог поверх контента (портал в body, Esc/клик-вне закрывают); слоты title/children/footer; sm/md/lg |
| `AlertDialog` | organism | подтверждение поверх `Modal` (destructive → красная кнопка) — удаление слайда/инсайта/дата-сета |
| `Toast` + `ToastProvider` / `useToast` | organism | тосты success/error/warning/info, авто-скрытие ~3.5с, стек снизу-справа |
| `DropdownMenu` | organism | меню по триггеру (клик-вне/Esc), `separatorBefore`, `destructive`-пункт — меню аватара, форматы экспорта |
| `DesktopOnlyNotice` | organism | экран-заглушка воркспейса на узких экранах (`fixed inset-0 lg:hidden`): «Axon рассчитано на десктоп» + возврат к проектам. Подключён в `app/page.tsx` |
| `Card` | molecule | default/raised/interactive · CardHeader/CardContent/CardFooter |
| `Avatar` | atom | initials-фолбэк · size: xs/sm/md/lg |
| `Skeleton` | atom | text/circular/rectangular (на системном `.shimmer`) |
| `Spinner` | atom | size: sm/md/lg (currentColor) |
| `FormField` | molecule | Label + контрол + error/hint |
| `cn` | util | join классов (clsx-lite, без зависимостей) |

**Уже было в коде (не трогали):** `ModeTabs`, `ModeToggle`, `ChartTypeDropdown`, `ComboLayoutDropdown`, `LayoutDropdown`, `OnboardingModal`, `tokens.ts` (JS-зеркало токенов для inline-стилей).

## Semantic-токены — добавлены в код

В `globals.css` добавлены `--color-success/warning/error/info` (+ `-foreground`) под тосты, валидацию форм и красную рамку dropzone (EC-1). Раньше были только в DESIGN.md.

## Миграция экранов на кит (поэтапно, с визуальной сверкой)

**Сделано:**
- ✅ Аватар «KS» на главной приложения → `<Avatar>` (1:1).
- ✅ `ProjectCard` → `<Card variant="interactive">` (4px) + цветной `<Badge>` статуса (ready=success / draft=warning / generating=info). Убраны хардкод-хексы.
- ✅ Чат-инпут (`ChatRail` — обычный + Build) → `<Textarea>`.
- ✅ Файл-чипы чата → `<Chip>`.
- ✅ Кнопки «Back» (page.tsx mobile-бар + Insight/DataSet drill-in) → `<BackButton>` (новый компонент; hover-хексы убраны на токен).

**Осталось / не мигрируем:**
- «+ NEW DATA SET» — это **не кнопка**, а подпись в drop-слоте (`PresentationStructure`); оставляем.
- `ExpandedView.tsx` — **мёртвый код** (нигде не импортируется), не трогаем.
- Скелетоны/спиннеры — в коде пока не реализованы (EC-3); мигрировать нечего.
- Дропдауны статусов/опций — уже компоненты (`ChartTypeDropdown` и т.п.).
- Формы `login`/`signup`/`settings` — это **новые** экраны (строятся через кит позже), не миграция.

**✅ Почищено (2026-06-14):** мёртвые `ExpandedView.tsx` и `Presentation.tsx` (0 импортов, держали хардкод-хексы) — **удалены**. tsc 0.

## Флаги на чистку кода (из DESIGN.md)

- Мёртвые `@import` Playfair + Fraunces в `globals.css` (serif-токен = Instrument Serif).
- `--radius-bubble: 20px` (CSS) ≠ `RADIUS_BUBBLE = 4` (tokens.ts) — выбрать один источник.
- Тени заданы инлайном в компонентах — вынести в токены.

## Responsive-стратегия (Урок 2, Шаги 7–8)

- **Главная `/`** — полностью адаптивна: nav сворачивается (`max-sm`), hero-лесенка паддингов, dropzone адаптируется, сетка проектов `grid-cols-3 → 2 → 1`, контейнер кэпится `max-w-screen-xl` (на 1920px не расплывается).
- **Воркспейс (Canvas/Слайды/Build/drill-in)** — **десктоп-first by design** (холст + drag-and-drop + AI-чат, как Figma/Miro). Ниже `lg` (1024px) — заглушка `DesktopOnlyNotice` вместо «сжатого десктопа». Решение пользователя 2026-06-14.
- **Фикс по ходу:** dropzone на главной переведена с хардкод-хексов на токены (`border-gold-500` / `border-border` / `bg-gold-500/…`).
- ⚠️ Аудит — по коду; живой Playwright-прогон (320/414/768/1024/1440/1920) не выполнялся (MCP-браузер был занят) — догнать позже.

## Картинки (Урок 2, Шаг 10)

- 5 онбординг-PNG (1064×760) → `next/image` (авто WebP/AVIF + `sizes`); ручной `new Image()`-preload убран. `next.config.ts`: avif/webp + `deviceSizes`. Деталь — `docs/ux-audit-2026-06-14.md`.

## Пробелы кита, выявленные визуал-спекой (05-ui-design-spec)

**✅ Добавлены organism'ы** (нужны под удаления/тосты/меню): `Modal`, `AlertDialog`, `Toast` (+ `ToastProvider`/`useToast`), `DropdownMenu`. Все в `/storybook` → группа ORGANISMS.

**⬜ Ещё нужны под будущие экраны** (не строим сейчас — нет соответствующих экранов в коде):
- `Checkbox` (atom) — согласие с условиями в `signup`.
- `Switch` (atom) — тема и тумблеры уведомлений в `settings`.
- `Table` / `DataTable` (organism, универсальная: columns+data, сортировка) + `Pagination` — `admin-users`.
