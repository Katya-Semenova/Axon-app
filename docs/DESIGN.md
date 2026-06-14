---
name: Axon
description: "Editorial Density — тёплая «бумага» + navy-рампа + золото как единственный акцент. Журнальный, плотный, спокойный. Светлая тема. Источник — токены кода (globals.css @theme + tokens.ts)."
colors:
  # ── Surface roles (shadcn-совместимые) ──
  background:          "#EDE9E0"
  foreground:          "#1B2840"
  card:                "#F5F2EA"
  card-foreground:     "#1B2840"
  popover:             "#FBF9F3"
  popover-foreground:  "#1B2840"
  muted:               "#E5E0D2"
  muted-foreground:    "#8A8B87"
  border:              "#D9D3C2"
  border-strong:       "#B8AE96"
  input:               "#D9D3C2"
  ring:                "#B89548"
  # ── Brand / primary ──
  primary:             "#1B2840"
  primary-foreground:  "#F5F2EA"
  accent:              "#B89548"
  accent-foreground:   "#1B2840"
  # ── Text ramp ──
  text-primary:        "#1B2840"
  text-secondary:      "#5C6478"
  text-tertiary:       "#8A8B87"
  text-on-dark:        "#F5F2EA"
  # ── Navy ramp (структура / данные) ──
  navy-900:            "#1B2840"
  navy-700:            "#2A3654"
  navy-500:            "#4A5878"
  navy-300:            "#8892AA"
  navy-100:            "#B8C2D0"
  # ── Gold ramp (единственный акцент) ──
  gold-700:            "#A8853E"
  gold-500:            "#B89548"
  gold-300:            "#C9A961"
  gold-100:            "#D4C9A8"
  # ── Slate ramp (холодные source-ноды) ──
  slate-mid:           "#A9AFBD"
  slate-inner:         "#D1D5DC"
  insight-card:        "#F3F4F6"
  # ── Именованные поверхности ──
  canvas:              "#EDE9E0"
  surface:             "#F5F2EA"
  surface-raised:      "#FBF9F3"
  surface-muted:       "#E5E0D2"
  pill-bg:             "#1B2840"
  pill-text:           "#F5F2EA"
  # ── Semantic — ПРЕДЛОЖЕНО под тосты/валидацию (в коде пока НЕТ) ──
  success:             "#4E7C59"
  success-foreground:  "#F5F2EA"
  warning:             "#A8853E"
  warning-foreground:  "#F5F2EA"
  error:               "#B0413E"
  error-foreground:    "#F5F2EA"
  info:                "#4A5878"
  info-foreground:     "#F5F2EA"
typography:
  display:
    fontFamily: "Instrument Serif"
    fontSize: "64px"
    fontWeight: "400"
    lineHeight: "68px"
    letterSpacing: "-0.015em"
  heading:
    fontFamily: "Instrument Serif"
    fontSize: "24px"
    fontWeight: "400"
    lineHeight: "29px"
  body:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "26px"
  body-sm:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "21px"
  caption:
    fontFamily: "Inter"
    fontSize: "12px"
    fontWeight: "400"
    lineHeight: "18px"
  label-mono:
    fontFamily: "JetBrains Mono"
    fontSize: "11px"
    fontWeight: "500"
    lineHeight: "14px"
    letterSpacing: "0.1em"
  mono-data:
    fontFamily: "JetBrains Mono"
    fontSize: "11px"
    fontWeight: "400"
    lineHeight: "14px"
rounded:
  none: "0px"
  sm: "4px"
  DEFAULT: "4px"
  bubble: "20px"
  pill: "9999px"   # только круглые: иконки-кнопки (send), avatar, свитчи — НЕ прямоугольные CTA/тогглы
spacing:
  unit: "4px"
  container-padding: "48px"
components:
  button-primary:
    backgroundColor: "{colors.pill-bg}"
    textColor: "{colors.pill-text}"
    rounded: "{rounded.sm}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sm}"
  input:
    backgroundColor: "{colors.surface-muted}"
    rounded: "{rounded.sm}"
  chat-bubble:
    backgroundColor: "{colors.navy-900}"
    textColor: "{colors.text-on-dark}"
    rounded: "{rounded.sm}"
  mode-tabs:
    rounded: "{rounded.none}"
---

## Overview

**Axon — «Editorial Density».** Характер: журнальный, спокойный, плотный — «тёплая бумага» вместо холодного дашборда. Три оси палитры: тёплые бежевые поверхности (бумага), navy-рампа для структуры и данных, **золото как единственный акцент**. Холодная slate-рампа — точечно, чтобы «source»-ноды (Insight-карточки) читались прохладными на тёплом холсте. Никаких чистого белого, холодных синих и индиго. **Тема — только светлая** (dark mode не поддерживается).

Продукт превращает данные в редакторскую презентацию (см. [PRD.md](PRD.md)), поэтому система ближе к издательской типографике (serif-дисплей + mono-лейблы), чем к «продуктовому» нейтралу.

## Colors

- **Поверхности (бумага):** background/canvas (#EDE9E0) → card/surface (#F5F2EA) → popover/surface-raised (#FBF9F3); вложенное и чипы — muted (#E5E0D2). Границы: border (#D9D3C2) и border-strong (#B8AE96).
- **Navy-рампа** (900→100) — структура, текст, первичные данные, фон pill/CTA, чат-бабблы.
- **Gold-рампа** (700→100) — **единственный акцент**: фокус-ринг, hover-границы dropzone, мелкие выделения. Не заливать золотом большие поверхности.
- **Slate-рампа** — только для холодных source-нод (Insight-карточки).
- **Текст:** primary #1B2840 · secondary #5C6478 · tertiary #8A8B87 · on-dark #F5F2EA.
- **Semantic** (предложены, в коде пока нет) — success/warning/error/info под тосты и валидацию; приглушённые под тёплую палитру. `error` также красит рамку dropzone при EC-1.
- **Контраст:** navy на бумаге и on-dark на navy проходят AA. Золото — только акцент/границы, не длинный текст на светлом.

## Typography

- **Display / Heading — Instrument Serif** (с italic-акцентами): hero (фактически `clamp(40px,5.8vw,68px)`) и заголовки модалок. Лицо бренда.
- **Body / UI — Inter:** body 16/1.6; UI-текст и инпуты 13.5–14; подписи 12.
- **Лейблы и данные — JetBrains Mono:** секц-лейблы 10.5–11 uppercase + letter-spacing 0.1em (wordmark «AXON», «Recent Projects», «AI Agent Chat»); числа — tabular (`'tnum' 1` глобально).
- Шкала компактная; крупный размер — только у hero.
- *Очистка: `globals.css` грузит `@import` Playfair Display + Fraunces, но serif-токен = Instrument Serif — мёртвые импорты убрать.*

## Layout

- **Плотность — компактная** (Editorial Density). Base unit 4px; рабочая шкала: 2 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 24 · 28 · 32 · 40 · 56 · 80 · 88 · 96.
- **Контейнер:** десктоп padding 48px (`px-12`), мобайл 16–24px; лендинг `max-w-screen-xl`.
- **Воркспейс** — полноэкранная оболочка `h-screen` с самоклипом; лендинг — `min-h-screen`, свободный скролл.
- Канвас-константы (node-граф): CARD_W 200, HERO_W 360, COL_GAP 14.
- **Z-index слои:** base 0 · dropdown 10 · sticky-nav 20 · mobile-bar 30 · overlay/modal 40 · toast 50 · drag (dnd-kit) 9999.

## Elevation & Depth

В основном **flat**: иерархия — поверхностями (canvas→surface→raised) и границами, не тенями. Тени — только для **floating/drag** на базе navy-rgba:
- `shadow-drag`: `0 6px 18px rgba(27,40,64,0.35)` — drag-чип дата-сета.
- `shadow-float`: `0 8px 24px rgba(27,40,64,0.40)` — ghost слайда при перетаскивании.

*Очистка: тени заданы инлайном в компонентах — вынести в токены.*

## Shapes

- Радиусы малые: **4px** (DEFAULT) — почти всё (карточки, инпуты, **кнопки включая primary**, тогглы/ModeToggle, дропдауны). Mode-tabs — **0** (намеренно квадратные). **pill 9999** — только круглые элементы: иконки-кнопки (send в чате), avatar, свитчи-переключатели. *(Раньше primary/ModeToggle были pill — наследие старого кода, выровнено до 4px.)*
- **Рассинхрон bubble:** CSS `--radius-bubble: 20px`, но чат-бабблы рендерятся **4px** (`tokens.ts RADIUS_BUBBLE=4`) — выбрать один источник правды.
- Границы — основной структурный приём: border (#D9D3C2), border-strong (#B8AE96).

## Animation

- `duration-fast` 150ms · `duration-base` 200ms · easing `ease`.
- Keyframes: `shimmer` 1.6s infinite linear (скелетоны) · `pulse-dot` 1.2s infinite ease-in-out («генерирую…») · `fade-in` 200ms ease (появление вьюх).

## Components

- **Button:** primary — navy-заливка (pill-bg/pill-text), **rounded-sm (4px)** как у secondary; варианты secondary/outline/ghost/destructive/link. Круглая 34×34 кнопка-иконка отправки в чате — отдельный паттерн (rounded-pill).
- **Card:** surface + 1px border + radius 4.
- **Input/Textarea:** surface-muted фон + border + radius 4; focus — золотой ring.
- **Badge/Chip:** surface-muted + mono-лейбл (файл-чипы, статусы, счётчики).
- **Chat bubble:** navy фон + on-dark текст; user-сообщения справа.
- **Mode tabs (CANVAS/SLIDES/PRESENT):** квадратные (radius 0).
- **Dropdowns/Popovers:** surface-raised + border.
- **Skeleton:** shimmer-градиент в тёплых тонах (#E5E0D2→#DAD3C0).

## Do's and Don'ts

**Do**
- Иерархию строй поверхностями и границами, не тенями.
- Золото — только акцент (фокус, hover-границы, мелкие выделения).
- Числа и лейблы — JetBrains Mono с tabular.
- Любой цвет/радиус/шрифт — через токен из этого файла.

**Don't**
- Не использовать чисто белый (#FFF), холодные синие, индиго.
- Не заливать золотом большие поверхности и не пускать его в длинный текст.
- Не плодить радиусы — почти всё 4px (включая кнопки и тогглы); tabs 0; pill — только круглое (send / avatar / свитчи).
- Не писать хексы в коде вне DESIGN.md.
- Тёмной темы нет — не вводить dark-токены без отдельного решения.
