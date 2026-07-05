# AXON

**Твои данные — понятным языком.** AXON превращает сырые данные (CSV/Excel) в готовую
презентацию: ИИ извлекает инсайты → собирает графики на холсте → пользователь складывает
слайды → показывает или делится ссылкой. Редакторский, журнальный вид вместо сухих дашбордов.

- **Прод:** лендинг [axon-app.ru](https://axon-app.ru) · сервис [axon-app.ru/ai-studio](https://axon-app.ru/ai-studio)
- **Стек:** Next.js (App Router) + TypeScript + Tailwind · PostgreSQL + Prisma · Better Auth ·
  OpenRouter (ИИ) · Selectel S3 · Docker + nginx на VPS
- **Полное описание продукта:** [docs/spec.md](docs/spec.md) → раздел «Продукт»

## Что где лежит

| Папка | Что это | Дверь |
|---|---|---|
| [development/](development/) | весь код: сервис + лендинг + общий UI-пакет (монорепо) | [README](development/README.md) |
| [docs/](docs/) | вся документация: спека, экраны, решения, память, правила | [README](docs/README.md) |
| [modules/](modules/) | 📚 личная библиотека из 83 переносимых AI-промтов | [README](modules/README.md) |
| [.claude/](.claude/) | настройки AI-помощника: скиллы, хуки-страховки | [README](.claude/README.md) |
| [scripts/](scripts/) | деплой, security-precheck, git-хуки, чекер библиотеки | комментарии в файлах |
| `lessons/` | материалы учебного курса (не в git) | — |

## Быстрый старт (локально)

```bash
cd development && npm install
npm run dev -w apps/app -- -p 3001        # сервис → http://localhost:3001/ai-studio
```
⚠️ Правило: **один dev-сервер на машину** — [docs/rules/dev-server.md](docs/rules/dev-server.md).
Нужны `.env` с ключами (не в git): список переменных — [docs/memory/state.md](docs/memory/state.md) → «Доступы».

## Тесты и деплой

```bash
npm run test -w apps/app        # быстрые тесты (Vitest, ~5 сек)
npm run test:e2e -w apps/app    # браузерные (Playwright, прод-сборка + тестовая БД)
./scripts/deploy-remote.sh      # деплой: precheck → тесты → выкат → smoke
```
Порядок безопасного выката и откат: [docs/rules/production-safety.md](docs/rules/production-safety.md).
Всё, что срабатывает само (хуки/гейты) и как отключить: [docs/automations.md](docs/automations.md).

## Для AI-ассистентов
Начинать с [AGENTS.md](AGENTS.md) (железные правила + таблица «читать по триггеру»),
затем [docs/memory/state.md](docs/memory/state.md) (текущее состояние).
