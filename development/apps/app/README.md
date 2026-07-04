# apps/app — сервис AXON

> Дверь в пакет. Был шаблонный README от create-next-app — заменён на карту (Урок 7, Задание 15).
> Поведение продукта описано НЕ здесь, а в [docs/spec.md](../../../docs/spec.md) и
> [docs/screens/](../../../docs/screens/) — спека всегда главнее кода.

Next 15 (App Router) · basePath **`/ai-studio`** ([ADR-010](../../../docs/decisions/ADR-010-app-url.md)) ·
прод: [axon-app.ru/ai-studio](https://axon-app.ru/ai-studio)

## Карта пакета

| Папка | Что внутри |
|---|---|
| `app/` | маршруты и экраны; `app/components/ui/` — UI-кит (хардкод стилей вне его запрещён) |
| `app/components/` | холст, графики (`ChartRenderer`), слайды (`presentation/`), чат-рейл |
| `app/api/` | auth (Better Auth) · ai (extract/chat) · files/avatar (S3) |
| `app/actions/` | server-actions: доски, шаринг, админка (владелец — только из сессии!) |
| `lib/` | store (Zustand) · auth · db (Prisma) · ai/ · file-parsing/ · insight-engine/ |
| `prisma/` | схема БД + миграции |
| `tests/` | Vitest (быстрые) + `tests/e2e/` (Playwright против прод-сборки) |
| `messages/` | i18n RU/EN (next-intl) |

## Команды (из этой папки)
```bash
npm run dev -- -p 3001   # ⚠️ один dev-сервер на машину — docs/rules/dev-server.md
npm run test             # Vitest, ~5 сек
npm run test:e2e         # Playwright: сам соберёт прод-сборку (нужен .env.test — см. tests/e2e/server.sh)
npx tsc --noEmit         # обязателен перед коммитом кода
```

## Перед правкой — прочитай
Правила по триггеру — таблица в [AGENTS.md](../../../AGENTS.md); минимум: спека экрана +
[_global.md](../../../docs/screens/_global.md), затем цепочка «спека → тест → код» (ADR-011).
