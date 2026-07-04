# development/ — монорепо кода

> Дверь в папку: три пакета одного воркспейса (npm workspaces). [ADR-009](../docs/decisions/ADR-009-monorepo-split.md).

| Пакет | Что это | Прод |
|---|---|---|
| [apps/app/](apps/app/) | сервис AXON (Next 15, basePath `/ai-studio`) | axon-app.ru/ai-studio |
| [apps/landing/](apps/landing/) | публичный лендинг (Next 16, EN) | axon-app.ru |
| [packages/ui/](packages/ui/) | `@axon/ui` — общие токены бренда | — |

## Команды (из этой папки)
```bash
npm install                                  # один раз, ставит всё
npm run dev -w apps/app -- -p 3001           # сервис (⚠️ один dev-сервер на машину!)
npm run dev -w axon-landing -- -p 3002       # лендинг
npm run test -w apps/app                     # быстрые тесты
npm run test:e2e -w apps/app                 # браузерные тесты (прод-сборка)
```

Деплой — из корня репо: `./scripts/deploy-remote.sh` (сам прогонит precheck + тесты + smoke).
Docker-образы: `apps/app/Dockerfile`, `apps/landing/Dockerfile` (контекст — эта папка).
