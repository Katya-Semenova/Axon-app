# Архитектура Axon (карта по коду)

> **Режим «по коду» (Урок 2, Шаг 4 — адаптация FSD).** Рецепт урока разворачивает `src/` по 6 слоям Feature-Sliced Design **с нуля**. Axon — уже собранное, задеплоенное приложение на Next.js App Router (`app/` в корне, НЕ `src/`). Поэтому мы **не переезжаем код в `src/`** (это сломало бы рабочий прод), а **документируем существующую структуру в терминах FSD**: какая папка играет какую роль, куда можно/нельзя импортировать, где расхождения. Это сверка дисциплины слоёв, а не реструктуризация.
>
> Источник правды по слоям FSD — рецепт `Lessons/.../lesson-02-design/prompts/04-fsd-architecture.md`. Архитектура состояний-вью (роутов всего 2) уже зафиксирована в [screens-map.md](screens-map.md) — здесь мы накладываем на неё слои.

## Главный вывод

Код **уже следует FSD-логике направления импортов**, хотя физически разложен иначе (на `app/`, не на `src/`):

- ✅ **UI-кит чист** — `app/components/ui/` (Button/Input/Card/Badge/…) не импортит ни фичи, ни бизнес-домен. Это настоящий `shared/ui`.
- ✅ **Фичи не импортят друг друга** крест-накрест (canvas не тянет chat и т.д.) — связь только через общий store.
- ✅ **State — единый центр** (`lib/store.ts`, Zustand), его читают все фичи + страница-оркестратор. Импорты идут «вниз», к общему слою.
- ⚠️ **Одно расхождение:** 5 «ui»-компонентов знают домен (см. «Расхождения», п. 5).

## Маппинг слоёв FSD → реальные папки Axon

| Слой FSD | Что регулирует | Где в Axon | Заметка |
|---|---|---|---|
| `app/` (роутинг, провайдеры, layout) | Вход, обвязка, глобальные стили | `app/layout.tsx` (шрифты next/font, `<html>`), `app/page.tsx` (оркестратор), `app/globals.css` (@theme-токены) | Канонично для App Router |
| `pages/` (страница на маршрут) | Контент каждого экрана | **Нет папки.** Axon — машина состояний: 2 роута (`/`, `/storybook`), остальные «экраны» = вью-состояния в store (`view` landing→workspace; `mode` data/presentation/build; drill-in/onboarding — оверлеи) | См. п. 2 расхождений |
| `widgets/` (крупные блоки обвязки) | Header/Sidebar/Footer-уровень | `ChatRail` (левый рельс), `ModeTabs` (плавающий переключатель), `PresentationStructure` (трей дата-сетов) — собираются в `page.tsx` | Обвязка живёт в оркестраторе, не в «страницах» |
| `features/` (действия пользователя) | Фича-слайсы | `app/components/{landing, canvas, chat, presentation, build}/` | Каждая папка = слайс; друг друга не импортят ✅ |
| `entities/` (бизнес-сущности) | Доменная модель | `lib/types.ts` (Insight / DataSet / Slide / Deck / Connection / …), `lib/mockData.ts` (моки), `lib/store.ts` (state + действия над сущностями) | Модель **централизована** в `lib/`, не разбита по `entities/<x>/` — см. п. 3 |
| `shared/ui/` (UI-кит без домена) | Примитивы и organism'ы | `app/components/ui/` — кит из Урока 2 (Button/Input/Card/Badge/Chip/Avatar/Modal/Toast/…) | Чистый, на токенах ✅ |
| `shared/lib` | Утилиты | `lib/charts.ts` (геометрия графиков), `app/components/ui/cn.ts` | — |
| `shared/config` | Токены/константы | `app/components/ui/tokens.ts` (JS-зеркало токенов), `globals.css @theme` | Источник — [DESIGN.md](DESIGN.md) |

## Направление импортов (проверено grep'ом по коду)

```
app/page.tsx (оркестратор)
   └─→ widgets (ChatRail, ModeTabs, PresentationStructure)
        └─→ features (canvas, chat, landing, presentation, build)
             └─→ entities/shared (lib/store, lib/types, components/ui)
```

Проверки на дату составления (Урок 2):
- `app/components/ui/*` **не импортит** ничего из `{canvas,chat,landing,presentation,build}` → кит ничего не знает о фичах. ✅
- `app/components/canvas/*` **не импортит** соседние фичи (chat/landing/presentation/build). ✅
- `lib/store.ts` читают: все 5 фич-папок + `page.tsx` + (домен-аварные) `ModeTabs`/`ModeToggle`. Импорт «вниз», к общему state. ✅

## Расхождения с каноническим FSD (осознанные, НЕ баги)

1. **`app/` в корне, не `src/`.** Next.js App Router штатно живёт в корневом `app/`. Переезд в `src/` ничего не даёт, кроме риска сломать прод. Оставляем.
2. **Нет `pages/` на каждый экран.** Axon — машина состояний (2 роута), а не роут-на-экран. «Экраны» спеки = вью-состояния (`view`/`mode`/оверлеи). Это сознательное решение, зафиксированное в [screens-map.md](screens-map.md). Файлы `docs/screens/*.md` описывают состояния, а не маршруты.
3. **Доменная модель централизована.** Все сущности — в одном `lib/types.ts`, state — в одном `lib/store.ts`, а не в `entities/<x>/{model,api,ui}/`. Для приложения такого размера один store проще; дробить на слайсы преждевременно.
4. **Public API через `index.ts` нет** — импорты идут прямыми путями (`@/app/components/...`). При росте можно добавить barrel-файлы, сейчас избыточно.
5. **5 компонентов в `ui/` знают домен** — `ChartTypeDropdown`, `ComboLayoutDropdown`, `LayoutDropdown`, `ModeToggle`, `ModeTabs` импортят `lib/store`/`lib/types`. По строгому FSD они НЕ `shared/ui` (тот про домен знать не должен) — это `features`/`entities`-уровень, исторически сложенный в папку `ui/`. **Флаг на чистку** (не срочно): при рефакторинге вынести в соответствующие фичи. Чистый кит (Button/Input/Card/…) этим не затронут.

## Флаги на чистку (сводно)

- [ ] 5 домен-аварных «ui»-компонентов → перенести в `features/entities` (п. 5 выше).
- [x] ✅ (2026-06-14) `ExpandedView.tsx` и `Presentation.tsx` — мёртвый код с хардкод-хексами — **удалены**.
- [ ] (из [DESIGN.md](DESIGN.md)) мёртвые `@import` Playfair+Fraunces; рассинхрон `--radius-bubble`; тени инлайном.
- [ ] Опционально: barrel-`index.ts` для слайсов, если структура разрастётся.

Все пункты — **необязательные улучшения**, не блокеры. Прод работает, направление импортов чистое.
