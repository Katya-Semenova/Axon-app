# FSD-архитектура — структура `src/` по 6 слоям

> Универсальный модуль библиотеки. Происхождение: курс vibecoding, урок 02 (обезличено 2026-07-04).

Цель: развернуть в `src/` структуру Feature-Sliced Design — 6 слоёв, импорты только вниз.

## 6 слоёв (сверху вниз)

```
src/
├── app/        ← роутинг, провайдеры, глобальные стили + layout.tsx с постоянной обвязкой (Header/Sidebar)
├── pages/      ← страницы целиком (по одной на маршрут из spec.md), только контент — без общей обвязки
├── widgets/    ← крупные блоки UI (Header, Sidebar, Footer) — подключаются в layout.tsx, не в страницах
├── features/   ← действия пользователя (LoginForm, AddToCart)
├── entities/   ← бизнес-сущности (User, Order — из модели данных spec.md)
└── shared/
    ├── ui/     ← UI-кит (atom / molecule / UI-organism)
    ├── lib/    ← утилиты
    ├── api/    ← базовый api-клиент
    └── config/ ← env, константы
```

## Две оси архитектуры

В проекте работают **две методологии одновременно** — это не конфликт, а гибрид:

| Где | Методология | Что регулирует |
|---|---|---|
| Снаружи (вся `src/`) | Feature-Sliced Design | Куда положить файл по бизнес-роли (entities/features/widgets/pages) |
| Внутри `shared/ui/` | Мягкий Atomic Design | Как думать про компоненты UI-кита (atom/molecule/organism) |

**Главное правило гибрида:** как только компонент знает о бизнес-домене (типы `User`, `Product`, `Order`, store сущности) — он уходит из `shared/ui/` в FSD-слои:

| Компонент | Где | По какому правилу |
|---|---|---|
| `Modal`, `Toast`, `DataTable` | `shared/ui/` | UI-organism без домена |
| `UserCard`, `UserAvatar` | `entities/user/ui/` | Знает о User |
| `LoginForm`, `AddToCartButton` | `features/login/ui/`, `features/add-to-cart/ui/` | Действие |
| `Header`, `Sidebar` | `widgets/header/`, `widgets/sidebar/` | Крупный доменный блок |

Atomic Design (atoms → molecules → organisms → templates → pages) **не подменяет** FSD — `pages/` и `templates/` Atomic Design'а нам не нужны, потому что эти роли играют FSD-слои `pages/` и `app/layout.tsx`. Atomic помогает только внутри UI-кита.

Подробное правило (можно сослаться в чате с AI): `docs/rules/ui-kit-atomic.md`.

## Правило: импорты только вниз

```
app → pages → widgets → features → entities → shared
```

**Запрещено:**
- Слайс импортит соседний слайс на том же уровне
- Слайс импортит из слоя выше

**Разрешено:**
- `pages/dashboard/` импортит из `widgets/`, `features/`, `entities/`, `shared/`
- `widgets/header/` импортит из `features/login`, `entities/user`, `shared/ui`

## Шаг 1 — Создать структуру

Создай папки:

```bash
mkdir -p src/{app,pages,widgets,features,entities}
mkdir -p src/shared/{ui,lib,api,config}
```

(UI-кит уже в `src/shared/ui/` из промта `ui-kit.md`.)

## Шаг 2 — Слайсы из spec.md

Прочитай `docs/spec.md` → раздел «Данные (модель)» → каждая сущность становится слайсом в `entities/`.

Например, если в модели есть `User`, `Order`:

```
src/entities/
├── user/
│   ├── model/
│   │   └── types.ts          ← interface User
│   ├── api/
│   │   ├── mock-user.ts      ← моки (заменяются при подключении БД)
│   │   ├── getUser.ts        ← запросы (пока вызывают моки)
│   │   └── updateUser.ts
│   ├── ui/
│   │   └── UserCard.tsx      ← переиспользуемая визуализация
│   └── index.ts              ← Public API слайса
└── order/
    ├── model/
    ├── api/
    ├── ui/
    └── index.ts
```

## Шаг 3 — Слайсы из действий пользователя

Прочитай `spec.md` → раздел «Экраны» → раздел «Действия» каждого экрана → действия которые переиспользуются на нескольких экранах становятся слайсами в `features/`.

Примеры:
- `features/login/` — форма логина (используется на /login и в модалке Header)
- `features/edit-profile/` — редактирование профиля
- `features/add-to-cart/` — добавить в корзину

Структура каждого слайса:
```
features/login/
├── ui/
│   └── LoginForm.tsx
├── model/
│   └── useLogin.ts          ← хук с логикой
├── api/
│   └── loginRequest.ts
└── index.ts
```

## Шаг 4 — Pages (страницы)

Прочитай `spec.md` → каждая страница из раздела «Экраны» становится слайсом в `pages/`:

```
src/pages/
├── home/
│   ├── ui/
│   │   └── HomePage.tsx
│   └── index.ts
├── profile/
├── settings/
└── ...
```

## Шаг 5 — Next.js routing в `src/app/`

Next.js App Router использует папку `app/` для маршрутов. В FSD `app/` тоже есть. Используем тонкие адаптеры:

```tsx
// src/app/(app)/profile/page.tsx — Next.js routing
import { ProfilePage } from "@/pages/profile"
export default ProfilePage
```

Это позволяет Next.js routing работать, а основная логика страницы — в FSD-слайсе `pages/profile/`.

## Шаг 5.1 — Постоянная обвязка через `layout.tsx` (меню не должно перезагружаться)

Общая обвязка приложения — меню, шапка (`Header`), боковое меню (`Sidebar`), подвал (`Footer`) — на всех внутренних экранах одна и та же. Если положить её **внутрь каждой страницы** (`pages/<screen>/`), то при каждом переходе она будет заново монтироваться и перерисовываться: меню «мигает», переключение между страницами медленное, активный пункт и состояние шапки сбрасываются.

В App Router для этого есть `layout.tsx`. Ключевое свойство: **layout переживает навигацию между его дочерними страницами и НЕ перемонтируется** — Next.js меняет только `{children}` (контент страницы), а сам каркас остаётся на месте. Поэтому обвязку кладём в сегментный layout, а не в страницы.

Используем route-группу `(app)` для внутренних экранов приложения. Обвязка живёт в её layout, страницы рендерят **только свой контент**:

```tsx
// src/app/(app)/layout.tsx — постоянная обвязка для всех внутренних экранов
import { Header } from "@/widgets/header"
import { Sidebar } from "@/widgets/sidebar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
```

```tsx
// src/app/(app)/profile/page.tsx — только адаптер на страницу, БЕЗ Header/Sidebar
import { ProfilePage } from "@/pages/profile"
export default ProfilePage
```

Правила:
- **Header / Sidebar / Footer / Nav — только в `(app)/layout.tsx`, не внутри `pages/`.** Страница рендерит свой контент и ничего не знает про общую обвязку.
- **Публичные экраны без меню** (лендинг, `/login`, `/signup`) кладём в **отдельную группу** `(public)` со своим `layout.tsx` (или вообще без него) — чтобы меню приложения не показывалось на странице входа. Группы в скобках на URL не влияют: `(app)/profile` и `(public)/login` дают `/profile` и `/login`.
- **Состояние обвязки** (открыт ли сайдбар, активный пункт меню) держим в самом layout/виджете, а активный пункт подсвечиваем через `usePathname()` — оно само следит за текущим URL, без ручного проброса на каждую страницу.

```
src/app/
├── layout.tsx            ← корневой: <html>/<body>, шрифт next/font, провайдеры
├── (public)/             ← экраны без меню приложения
│   ├── layout.tsx        ← минимальная обёртка (или без неё)
│   ├── login/page.tsx
│   └── page.tsx          ← лендинг / главная
└── (app)/                ← внутренние экраны приложения
    ├── layout.tsx        ← Header + Sidebar (постоянная обвязка)
    ├── profile/page.tsx
    └── settings/page.tsx
```

## Шаг 5.2 — Навигация через `<Link>` (мягкие переходы + кэш)

Чтобы переключение страниц было быстрым, внутренние переходы делаем через `<Link>` из `next/link`, а не через `<a href>` и не через `window.location`:

```tsx
import Link from "next/link"

<Link href="/profile">Профиль</Link>   // ✅ мягкая навигация
<a href="/profile">Профиль</a>          // 🔴 полная перезагрузка страницы — каркас тоже перегрузится
```

Что это даёт:
- **Мягкая навигация (client-side):** меняется только контент внутри `(app)/layout.tsx`, постоянная обвязка остаётся смонтированной — то самое «меню не перезагружается».
- **Префетч:** Next.js заранее подгружает код и данные для видимых на экране ссылок, поэтому переход ощущается мгновенным.
- **Router Cache:** уже посещённые сегменты держатся в памяти браузера, повторный заход на страницу не грузит всё заново.

`<a href>` оставляем только для внешних ссылок (на другой сайт). Для навигации из обработчика (после сабмита формы и т.п.) — `router.push()` из `next/navigation`; он тоже даёт мягкую навигацию и сохраняет обвязку.

## Шаг 6 — Public API через `index.ts`

Каждый слайс экспортирует только нужное наружу через `index.ts`:

```ts
// features/login/index.ts
export { LoginForm } from './ui/LoginForm'
export { useLogin } from './model/useLogin'
// loginRequest НЕ экспортирован — внутренняя реализация
```

Снаружи используем только `import { LoginForm } from '@/features/login'`, не глубокие пути.

## Шаг 7 — Проверка импортов

```bash
# Проверить что слайсы не импортят друг друга на том же уровне
grep -r "from '@/features/" src/features/ | grep -v "from '@/features/$(folder)'"
```

Если найдено — это нарушение FSD, пересмотри (либо общий код вынести в `entities/`, либо использовать паттерн @x для cross-entity).

## После выполнения

1. Покажи `tree -L 3 src/`

2. Для каждого слайса покажи содержимое `index.ts`

3. Проверь что импорты идут только вниз
