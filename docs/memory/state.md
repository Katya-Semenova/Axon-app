# Состояние проекта AXON (state)

> Где мы сейчас + что осталось. Обновлено **2026-07-04**.
> На старте сессии читать ТОЛЬКО этот файл + `docs/decisions/INDEX.md`; остальное — по ссылкам.
> Прошлая (полная) версия — `state-archive-2026-07-04.md`; история — `docs/decisions/sessions/`.

## ⚠️ Времянки — НЕ ЗАБЫТЬ (обновлено 2026-07-05)
1. **Basic Auth ВОЗВРАЩЁН 2026-07-05** (показы преподавателю прошли; `/ai-studio` → 401).
   Снять в день презентации команде ~11.07, после — вернуть. Шпаргалка со всеми командами
   (и через Клода, и руками) — `docs/promotion/demo-stand-howto.md`.
2. **Демо-режим ВЫКАЧЕН НА ПРОД 2026-07-05 и проверен** (кнопка на /login за замком,
   demo-login 200; аккаунт `demo-stand@axon-app.ru` — `demo@` занят чужим, не использовать;
   коммит `4968971` — проброс флага в build.args+Dockerfile). **ОСТАЛОСЬ: наполнить
   демо-аккаунт показательным проектом** (`test-data/gym-traffic.csv` → золотой heatmap,
   + `marketing-channels.csv`) — руками или сказать Клоду «наполни демо-проект».
   QR для презентации: `docs/promotion/qr-demo-stand.png` (ведёт на /ai-studio/login).
3. **Слияние сделано 04.07:** main передвинут (fast-forward) на вершину `feature/highcharts-spike`,
   обе ветки на одном коммите. Пуш обеих — за пользователем (`git push -u origin main` +
   `git push -u origin feature/highcharts-spike`); pre-push сам прогонит тесты.
4. **🆕 Highcharts: ИНТЕГРАЦИЮ ДЕЛАЕМ (решение пользователя 04.07).** Презентация ~через неделю;
   окно работы — вечер 04.07 + 05.07. Спайк уже в коде: `lib/renderEngine.ts` +
   `HighchartsRenderer.tsx` + пакет highcharts 13, фича-флаг выключен. Кто делает (этот чат /
   чат графиков) — согласовать при старте: файлы графиков — зона чата графиков.

## Текущий этап — Урок 7 (финализация), в работе
**Сделано:** Задания 1–4 ✅ (карта приложения, паспорта экранов, `_global.md`, BDD тест-кейсы —
прогнаны на проде вручную). Задание 5: **5.2 хуки+реестр ✅** (`post-tool-use-edit`,
`pre-read-suggest`, `docs/automations.md`), **5.3 память ✅** (ADR-011 spec→test→код, IMPL-теги
во всех ADR, `project-context.md`, `feature-registry.md`, этот state), **5.4 правила — в работе**
(6 правил в `docs/rules/` + таблица AGENTS.md).
**5.1 автотесты — часть 1 ✅ (04.07):** Vitest, 29 интеграционных тестов (`apps/app/tests/`:
разбор CSV, евро-числа, типизация колонок, выбор графика, buildBoardData, регрессии ревью) +
гейты: pre-push (`scripts/git-hooks/pre-push`, подключение `git config core.hooksPath
scripts/git-hooks`) и деплой (`deploy-remote.sh`, обход `SKIP_TESTS=1`). Красный тест реально
блокирует (продемонстрировано).
**5.1 часть 2 ✅ (04.07):** Playwright e2e — 4 теста (сценарии 1/2/4) против прод-сборки
standalone (порт 3101, `tests/e2e/server.sh`) на тестовой БД `axon_test` (Neon, `.env.test` —
не в git); ИИ в тестовом сервере выключен. Гейт деплоя → `test:all` (Vitest+e2e).
**Задание 6 ✅ (04.07):** безопасная выкатка — правило №4 в AGENTS.md (боевая база
неприкосновенна) + `docs/rules/production-safety.md` (порядок выката/отката, expand-contract)
+ smoke-проверка прода в конце `deploy-remote.sh` (красный smoke → стоп + подсказка отката).
**Задание 12 ✅ (04.07):** /storybook на проде — только админ (ADMIN_EMAIL), чужим 404;
цепочка spec→test→код, e2e 5/5. **Задания 13–14 ✅ (04.07):** скилл `/ux-testing`
(.claude/skills) + финальный сводный security-check — критичных НЕТ, отчёт
`docs/audits/security-check-final-MVP-2026-07-04.md`; восстановлены «всегда-включённые»
слои: блокирующие хуки pre-tool-use-bash/-write, `scripts/security-precheck.sh` в гейте
деплоя, `.claude/claude-security-guidance.md`; security-todo.md — post-launch список.
**Задания 7–10 ✅ (04.07):** библиотека модулей `modules/` — 85 обезличенных промтов курса
по 5 направлениям + `_INDEX.md` + AGENTS-карты + чекер/хук индексации + скиллы
`/init-project` и `/extend-library` + реестр скиллов `.claude/skills/_INDEX.md`; ADR-012
(переезд в projects/ отложен осознанно). Чужие скиллы (skills.sh) — по требованию через
`/extend-library`. Известный мелкий долг: 3 варианта save-session в ai-config — слить в один.
**Задание 15 ✅ (04.07):** сеть README — корневой + docs/ + modules/ (человеческое объяснение
библиотеки) + .claude/ + development/ + apps/app (заменён шаблонный) + packages/ui. Плюс по
ревью соседа: одобрен его фикс пречека (ecd2ebf) и починен pre-tool-use-write (не блокирует
правку файлов-детекторов).
**Осталось в Уроке 7:** e2e-хвост (IDOR, файл через UI, шаринг, 429 — по мере надобности)
→ 13–14 (/ux-testing + финальный security-check) → 7–10 (библиотека модулей) → 15 (README)
→ 16 (финальный /save-session).

## Параллельные треки (другие чаты)
- **Темы деки / графики:** глобальная переделка тем ✅ закрыта 2026-07-02, показ руководителю
  прошёл успешно; сейчас — полировка графиков/i18n к показу команде. Их файлы: ChartRenderer /
  MiniChart / ChartFill / types.ts / backlog.md — в этом чате НЕ трогаем.
- **Лендинг:** хвост (dark CTA, FAQ, /contact, Features) — план согласован, не начат.

## Уроки 1–6 — завершены
Продукт+дизайн (1–2) → деплой VPS (3) → бэкенд: БД/auth/письма/S3/разбор файлов/шаринг (4) →
ИИ: извлечение инсайтов + чат + админка + security (5) → публичная упаковка: лендинг/SEO/GEO/
аналитика/юр-страницы + монорепо и топология `/ai-studio` (6). Детали — журналы сессий и архив.

## Что где (ключевые файлы)
- Спека: `docs/spec.md` · экраны: `docs/screens/` (+`_global.md`) · дизайн: `docs/DESIGN.md`
- Память: `docs/decisions/` (ADR+INDEX+sessions) · `docs/memory/` (state, project-context,
  feature-registry, infrastructure) · бэклог: `docs/backlog.md`
- Автоматизации: `docs/automations.md` · правила: `docs/rules/` · тест-кейсы: `docs/test-cases.md`
- Код сервиса: `development/apps/app/` (Next 15, basePath `/ai-studio`) · лендинг:
  `development/apps/landing/` · общий UI: `development/packages/ui/`
- Деплой: `deploy.sh` + `docker-compose.yml` (корень) + `scripts/deploy-remote.sh`

## ⚠️ Dev-сервер на этом Mac
`next dev` роняет Mac (fork failed) при осиротевших node-процессах. Правила: максимум ОДИН
dev-сервер на машину (спросить про другой чат!), запуск только `run_in_background` + гасить
через TaskStop. Прод-проверки — на проде. Команды:
`cd development && npm run dev -w apps/app -- -p 3001` (сервис) / `-w axon-landing -- -p 3002`.

## Доступы (ENV — в `.env*`, не в git)
`DATABASE_URL` (dev Neon / prod docker) · `BETTER_AUTH_*` (разные dev/prod) · `RESEND_API_KEY`
(prod) · `S3_*` (Selectel) · `OPENROUTER_API_KEY` (ИИ) · `ADMIN_EMAIL` · `NEXT_PUBLIC_YM_ID`.
