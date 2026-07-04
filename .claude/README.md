# .claude/ — настройки AI-помощника

> Дверь в папку: что здесь и где реестры. Едет с репозиторием — работает у любого чата.

- **[skills/](skills/)** — скиллы (команды `/имя`, Claude зовёт их и сам по описанию).
  Реестр всех: [skills/_INDEX.md](skills/_INDEX.md). Скилл — тонкая обёртка; рецепты живут
  в `modules/` (один источник правды).
- **[hooks/](hooks/)** — хуки-страховки: предупреждающие (хардкод, спека, индекс библиотеки)
  и БЛОКИРУЮЩИЕ (опасные команды, запись секретов). Что делает каждый и как отключить:
  [docs/rules/hooks-guardrails.md](../docs/rules/hooks-guardrails.md) + реестр
  [docs/automations.md](../docs/automations.md).
- **[settings.json](settings.json)** — регистрация хуков (общая, в git).
- **[claude-security-guidance.md](claude-security-guidance.md)** — правила безопасности проекта
  (модель угроз, история багов) — на них опираются проверки.
- `.cache/` — глушилки хуков (не в git).

Главные правила для AI — в корневом [AGENTS.md](../AGENTS.md); память проекта — в
[docs/memory/](../docs/memory/) и [docs/decisions/](../docs/decisions/).
