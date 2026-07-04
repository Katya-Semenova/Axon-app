# Библиотека модулей — общий реестр

> Переносимый AI-стек: 85 обезличенных промтов курса, работают в любом проекте.
> **Правило:** промт без строки здесь — «слепой», AI его не найдёт. Новый промт → строка сюда
> (+ карта модуля `<модуль>/AGENTS.md`). Проверка: `bash scripts/check-modules-indexed.sh`.
> Точки входа: скилл `/init-project` (новый проект одной фразой) · `/extend-library` (пополнение).
> Решение о библиотеке: `docs/decisions/ADR-012-modules-library.md`.

## ai-config — ассистент, память, правила, механика скиллов/хуков

| Промт | Когда звать |
|---|---|
| ai-config/prompts/ai-assistant-setup.md | старт нового проекта: permissions + AGENTS.md-хаб |
| ai-config/prompts/init-project.md | новый проект одной фразой: каркас+git+память+маршрут |
| ai-config/prompts/rules-setup.md | настроить 6 правил дисциплины AI (docs/rules/) |
| ai-config/prompts/memory-setup.md | заполнить память проекта (state, ADR+IMPL, INDEX) |
| ai-config/prompts/memory-search.md | «почему выбрали X / было ли Y» — поиск по памяти |
| ai-config/prompts/memory-system.md | спроектировать/апгрейдить систему памяти (+agentmemory) |
| ai-config/prompts/save-session.md | конец этапа: журнал сессии + state + INDEX |
| ai-config/prompts/session-progress-save.md | вариант save-session (ранняя редакция; предпочитай save-session) |
| ai-config/prompts/memory-update-session-save.md | вариант save-session после бэкенд-этапа (предпочитай save-session) |
| ai-config/prompts/how-to-build-your-prompt.md | оформить только что сделанное как свой промт (6 секций) |
| ai-config/prompts/build-modules-library.md | собрать/пересобрать личную библиотеку модулей |
| ai-config/prompts/maintain-modules.md | вынести наработку / вобрать чужой подход из git |
| ai-config/prompts/extend-library.md | пополнение библиотеки: своё · по ссылке · skills.sh |
| ai-config/prompts/install-power-skills.md | поставить 6 повседневных скиллов (review/debug/…) |
| ai-config/prompts/final-save.md | зафиксировать готовый MVP (state «v1.0» + save) |

## product — продуктовый этап

| Промт | Когда звать |
|---|---|
| product/prompts/product-context-interview.md | первый продуктовый шаг: интервью → spec.md «Продукт» |
| product/prompts/spec-from-figma.md | детализация спеки, когда есть Figma-макеты |
| product/prompts/spec-from-screenshots-or-scratch.md | детализация спеки по скриншотам или с нуля |
| product/prompts/spec-final-check-prd.md | финальная сверка спеки + одностраничный PRD |
| product/prompts/app-map.md | карта приложения (маршруты/доступы + интерактивный HTML) |
| product/prompts/landing-research-brief.md | бриф лендинга (сегменты, JTBD, крючок) до вёрстки |
| product/prompts/readme-network.md | сеть README-указателей по проекту |

## design — дизайн-система, UI-кит, экраны, лендинг

| Промт | Когда звать |
|---|---|
| design/prompts/design-tokens.md | собрать DESIGN.md (токены) — до UI-кита |
| design/prompts/ui-kit.md | UI-кит на токенах + витрина /style-guide |
| design/prompts/figma-code-connect.md | маппинг Figma-компонентов на код (1:1 генерация) |
| design/prompts/screen-visual-spec.md | визуальный контракт экрана до первого JSX |
| design/prompts/screen-generation.md | генерация экранов прототипа (mobile+desktop) |
| design/prompts/responsive-audit.md | адаптив-аудит всех экранов 320–1920 |
| design/prompts/adaptive-audit.md | финальный адаптив-аудит лендинга/публичных страниц |
| design/prompts/prototype-verification.md | проверка прототипа перед «готово» |
| design/prompts/ux-audit.md | UX-аудит: тупики, orphan-экраны, заглушки — перед деплоем |
| design/prompts/landing-page.md | вёрстка нешаблонного лендинга по брифу |
| design/prompts/hide-style-guide.md | спрятать dev-страницы (/style-guide) с прода |

## development — код: БД, auth, деплой, тесты, security, интеграции

| Промт | Когда звать |
|---|---|
| development/prompts/project-init-nextjs.md | первый шаг разработки: Next+TS+Tailwind каркас |
| development/prompts/fsd-architecture.md | развернуть FSD-архитектуру перед экранами |
| development/prompts/feature-development.md | любая новая фича: интервью → бриф → роли |
| development/prompts/db-choice.md | где живёт БД (managed vs свой Postgres) — ADR |
| development/prompts/orm-choice.md | Prisma vs Drizzle (если не устраивает дефолт) |
| development/prompts/postgres-server-setup.md | Postgres в docker на VPS + cron-бэкап |
| development/prompts/db-schema-migrations-seed.md | схема из спеки + миграции + seed |
| development/prompts/mocks-to-real-data.md | замена моков на реальные запросы + перфоманс |
| development/prompts/auth-basic.md | авторизация (better-auth/NextAuth) + защита роутов |
| development/prompts/auth-security.md | защиты auth: cookie-флаги, rate limit, enumeration |
| development/prompts/account-email-templates.md | письма аккаунта (React Email + Resend) |
| development/prompts/product-emails.md | продуктовые письма (инвайты/статусы) |
| development/prompts/account-settings-notifications.md | кабинет /settings + IDOR + центр уведомлений |
| development/prompts/file-storage.md | файловое хранилище (S3/MinIO, signed URLs) |
| development/prompts/persistence-smoke-check.md | смоук: CRUD реально пишет в базу |
| development/prompts/screens-spec.md | довести паспорта экранов до полноты |
| development/prompts/global-spec.md | сквозные правила экранов (_global.md) + закрепление |
| development/prompts/test-cases.md | BDD тест-кейсы → автотесты с гейтами push/deploy |
| development/prompts/ux-testing.md | оформить свой /ux-testing (живой прогон в браузере) |
| development/prompts/feature-registry.md | реестр реализованных фич («есть ли уже X?») |
| development/prompts/post-tool-edit-hook.md | хук от хардкода + подсказки ADR + рецепт своих хуков |
| development/prompts/ai-guardrail-hooks.md | блокирующие хуки: опасные команды, запись секретов |
| development/prompts/git-concepts-intro.md | основы Git наглядно (до первого push) |
| development/prompts/git-github-ssh-setup.md | подключение GitHub (SSH/gh) + первый push |
| development/prompts/env-secrets.md | .env/.env.example, чистка секретов из кода |
| development/prompts/env-backup-handoff.md | бэкап секретов и передача проекта |
| development/prompts/deploy-strategy-adr.md | выбор стратегии деплоя — ADR (до первого выката) |
| development/prompts/deploy-vps-docker-compose.md | полный подъём на VPS (docker-compose, nginx) |
| development/prompts/deploy-cheatsheet.md | шпаргалки: обновить прод, логи, откат, бэкап |
| development/prompts/domain-https-nginx.md | домен + HTTPS + security-заголовки |
| development/prompts/server-security-basics.md | укрепление сервера: SSH-ключи, UFW, fail2ban |
| development/prompts/zero-downtime-deploy.md | выкат без обрывов (graceful + blue-green) |
| development/prompts/security-check-template.md | эталонный чек-лист security-аудита (14 разделов) |
| development/prompts/security-check-skill-build.md | первый аудит + оформление своего /security-check |
| development/prompts/security-check-auth-db.md | аудит после БД+auth (IDOR на 2 аккаунтах) |
| development/prompts/security-check-integrations.md | аудит после интеграций (ИИ/админка/API/боты) |
| development/prompts/security-precheck-deploy-gate.md | bash-гейт секретов перед каждым деплоем |
| development/prompts/infrastructure-snapshot.md | снимок инфры в память (infrastructure.md) |
| development/prompts/monorepo-split.md | миграция в монорепо (app + landing + ui) |
| development/prompts/app-domain-choice.md | продукт на /app или поддомене — решение + сетап |
| development/prompts/ai-openrouter-integration.md | ИИ-фичи в продукте через OpenRouter |
| development/prompts/admin-panel.md | админка: роль, гейт, таблицы, метрики |
| development/prompts/rest-api-keys.md | внешний REST API с API-ключами и лимитами |
| development/prompts/telegram-owner-alerts.md | Telegram-алерты владельцу о событиях |
| development/prompts/uptime-monitoring.md | мониторинг доступности прода + алерт |
| development/prompts/pwa.md | PWA: манифест, офлайн, service worker |
| development/prompts/image-optimization.md | оптимизация картинок (sharp, avif/webp) |

## seo-geo — SEO, индексация, аналитика, контент

| Промт | Когда звать |
|---|---|
| seo-geo/prompts/seo-meta.md | мета/OG/favicon для лендинга и сервиса |
| seo-geo/prompts/indexation-geo.md | robots/sitemap/noindex + GEO (llms.txt, JSON-LD) |
| seo-geo/prompts/analytics.md | подключить аналитику + события воронки |
| seo-geo/prompts/legal-pages.md | юр-страницы (152-ФЗ) + cookie-баннер + согласия |
| seo-geo/prompts/copywriting-humanize.md | вычитка текстов от AI-штампов |
