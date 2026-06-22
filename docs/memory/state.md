# Состояние проекта (state)

> Где мы сейчас + что осталось. Обновлено 2026-06-17.

## Текущий этап
**Урок 5 (расширяем сервис) — ЗАВЕРШЁН (2026-06-19): Шаг 1 (ИИ) + Шаг 2 (админка) + Шаг 5 (security-check). Задеплоено и проверено на проде.**
Провайдер-агностичный слой `lib/ai/` (дефолт OpenRouter, GigaChat — опция; [ADR-008](../decisions/ADR-008-ai-provider.md)).
- **(а) Извлечение инсайтов:** реальный ИИ в разъёме `ParsedTable → BoardData` рядом с правилами (fallback);
  гибрид (ИИ выбирает колонки/график/нарратив, числа считает код); только вошедшим; приватность (схема+выборка);
  синхронно. Файлы: `lib/ai/*`, `lib/insight-engine/ai-plan.ts` + `extract.ts`, route `app/api/ai/extract`.
- **(б) AI-чат по данным:** в Data-рейле ИИ отвечает словами по сводке доски + «Советник + Построить инсайт»
  (Apply строит новый инсайт на реальных числах через executePlan; правки существующего — руками, не чат);
  только вошедшим; чат хранится в `BoardData` (ADR-003); `sourceTable` в памяти (не персист). Файлы:
  `lib/ai/chat.ts`, route `app/api/ai/chat`, `lib/store.ts` (applyAddInsight/dataChatMessages/sourceTable), `ChatRail.tsx`.

- **Шаг 2 (Админка)** — owner-панель v1 **read-only** по `ADMIN_EMAIL` (env, без миграции): `/admin/users`
  (сводка+список+поиск) + `/admin/users/[id]` (профиль+доски). Гейт: не-админ → 404; вход — из `/settings`.
  Файлы: `lib/admin.ts`, `app/actions/admin.ts`, `app/admin/users/*`. Роль в БД — после Урока 7 (backlog).
- **Шаг 5 (Security-check)** — ИИ + админ-поверхности, критичных нет; prompt-injection ограничен по
  конструкции + добавлен hardening в промпты. Аудит `docs/audits/security-check-2026-06-19.md`.

**Задеплоено на прод (axon-app.ru) и проверено живьём 2026-06-19:** чат отвечает, числа верные (Books/Германия),
Apply + авто-пан + авто-пан при загрузке файла, админка, гейты (401/404). По пути — 4 фикса приёмки (чат-рейтинг,
Donut-легенда, B1/B2 авто-пан) + фикс деплоя ИИ-env (`docker-compose.yml → web.environment` — грабли).
`AI_MODEL=anthropic/claude-sonnet-4.6`. **Остаётся опц.:** uptime-мониторинг (внешний), Telegram-алерты.
**Дальше:** Урок 6; отложенные фичи (Блок 2) и FSD (после Урока 7) — в `docs/backlog.md`.

## Урок 6 (публичная упаковка) — В РАБОТЕ с 2026-06-20

**⚠️ ЛЕНДИНГ УЖЕ СУЩЕСТВУЕТ — отдельным проектом в соседней папке (не внутри `axon-app/`):**
- Путь: `../axon-landing/` (рядом с `axon-app/`, внутри `AXON code/`). Отдельный Next.js 16
  проект со СВОИМ `.git`. Запуск: `cd ../axon-landing && npm run dev`.
- Стек: Next 16, framer-motion + gsap + `@studio-freight/lenis` (smooth-scroll) + lottie-react.
  Шрифты: Instrument Serif (дисплей) / Inter (текст) / JetBrains Mono. Палитра = бренд AXON
  (navy `#1A2742`, gold `#C8A86B`, cream `#F4F0E8`, slate `#8B95A8`) — но захардкожена inline,
  НЕ через токены DESIGN.md.
- Секции (все живут в `../axon-landing/app/page.tsx`, ~950 строк):
  NAV · HERO (★ chaos-анимация: токены+скрин-SVG слетаются из центра, drift/breathe; пословное
  появление заголовка) · WHY AXON / «Easy-peasy» (★ bento 4 карты въезжают + count-up 6 hrs→12 min
  со страйк-аутом + цикл подсветки шагов) · THE SHIFT (★ sticky scroll-драйв 5 актов в окне браузера,
  500vh трек) · THREE MODES (Canvas/Slides/Present) · PROTOTYPE TEASER (navy, `PrototypeShowcase`
  live-компонент в `app/_axon/`) · FEATURES (bento) · CTA · FOOTER.
- ★ = ценные анимации/секции, которые пользователь хочет ПЕРЕИСПОЛЬЗОВАТЬ.
- Ассеты/скрины: `../axon-landing-assets/screenshots/` + прототип `../AXON code/index.html`.

**Шаг 0 (монорепо-сплит) — почти готов (2026-06-20). [ADR-009](../decisions/ADR-009-monorepo-split.md).**
Код переехал в `development/` (workspace): `apps/app` (сервис, Next 15) + `apps/landing`
(перенесён реальный `../axon-landing`, Next 16) + `packages/ui` (`@axon/ui`, токены бренда).
Сделано и проверено живьём (оба dev-сервера, вход/выход):
- ✅ переезд сервиса, общий пакет, перенос лендинга, обе сборки зелёные;
- ✅ фикс безопасности `/api/files` (path-traversal); CTA лендинга → `axon-app.ru` (не vercel);
  убрана нерабочая «Sign in» из шапки лендинга;
- ⏳ **деплой-рецепт — ОТЛОЖЕН до Шага 1** (нельзя проверить без Docker/VPS; стоп-кран в
  `deploy.sh`/`deploy-remote.sh`, чтобы случайная публикация не сломала прод). См. infrastructure.md.
- Точка отката: коммит `961cbec`.
**Шаг 1 (лендинг) — НАЧАТ 2026-06-20:**
- ✅ Бриф: `docs/landing-brief.md` (главный сегмент — аналитики; остальные в «для кого»).
- 🟡 **PROTOTYPE TEASER — черновик (WIP, не финал):** слова Inter-500 (не serif — serif отклонён),
  кнопка золотая-обводка уже+у квадрата, рамка квадрата 5px золотая, дата-сет/слайд смягчены,
  контент ×1.1; плавающие цифры сохранены. Пользователю «что-то не то» — дорабатываем.
  Прозрачный фон квадрата ОТКЛОНЁН (давал грязь на тёмном). Файлы: `apps/landing/app/page.tsx`
  (секция `#prototype`) + `app/_axon/PrototypeShowcase.tsx` + `globals.css` (`.proto-cta`).
- ⬜ **FEATURES — не начат:** банальный/скучный блок, редизайн; **референсы за пользователем**.
- ✅ **Задание 1.1 — URL приложения (2026-06-21):** подстраница **`/app`** (не поддомен),
  [ADR-010](../decisions/ADR-010-app-url.md). Причина — соло-проект, один origin → cookie входа
  и языка общие; поддомен `app.` отложен до роста. От этого зависят индексация, редиректы, PWA.
- ⬜ **Двуязычный лендинг — отложено в бэклог** (отдельной задачей ПОСЛЕ слияния дизайна
  соседнего чата, иначе конфликты в `page.tsx`). Лендинг сейчас только EN; см. `docs/backlog.md`.
- ✅ **Задание 0.5 — скилл `/avoid-ai-writing` (2026-06-21):** `.claude/skills/avoid-ai-writing/SKILL.md`,
  `user-invocable`. Протокол вычитки от AI-штампов **вшит в скилл** (не ссылка на `lessons/` — её не
  коммитим), пути под наш репо. Профиль `landing`. Применим к текстам лендинга в Задании 1.
- ⬜ Дальше по Шагу 1: юр-страницы, аналитика, PWA +
  **починка деплоя вживую** (снять стоп-кран, см. [ADR-009] / infrastructure.md).
**Шаг 2 (SEO-мета) — В РАБОТЕ 2026-06-21:**
- ✅ **Иконки бренда:** из знака-логограммы (navy на cream) — `app/icon.svg` (чёткий везде) +
  `favicon.ico` (16/32/48) + `apple-icon.png` (180). Next App Router подхватывает из `app/`. Исходные
  SVG бренда (знак/логотип/полный) — в `apps/landing/public/brand/`. Генерил sharp-скриптом.
- ✅ **OG/Twitter превью 1200×630:** `app/opengraph-image.png` + `twitter-image.png` (+ `.alt.txt`) —
  navy + логотип со **split-знаком** (золотая вертикальная X + cream диагональная) + золотая X в AXON +
  крючок (1-е предложение cream, 2-е золотом) + домен. **Бренд-шрифты** (Instrument Serif italic +
  JetBrains Mono), рендер через resvg по файлам шрифтов. File-convention, без правки `layout.tsx`.
  Favicon при этом НЕ трогали (остаётся сплошной navy на cream). Источник split-знака — `public/brand/logogramma_split.svg`.
- ✅ **Текстовые мета (2026-06-22):** в `apps/landing/app/layout.tsx` — `metadataBase`
  (`https://axon-app.ru`), title 52 симв. («Axon — Turn raw data into presentation-ready stories»),
  description 154 симв., `openGraph.title`/`twitter.title` = «From data to story, in minutes»
  (соц-крючок ≠ SEO-title). og:image остаётся из file-convention `opengraph-image.png`.
- ⬜ Проверка превью через opengraph.xyz + Telegram — после правки текстовых мета.

**Шаг 3 (Индексация + GEO) — В РАБОТЕ 2026-06-21. Выбран ПОЛНЫЙ GEO.**
- ✅ `apps/landing/public/robots.txt` — публичное открыто, закрыты `/app /admin /api /settings /dashboard`,
  AI-боты не блокированы (GEO), ссылка на sitemap.
- ✅ `apps/landing/app/sitemap.ts` — только публичные URL (сейчас `/`; юр-страницы — в Задании 3.2).
- ✅ `apps/landing/public/llms.txt` — GEO-карта продукта для нейросетей (EN).
- ✅ noindex на сервисе — `robots:{index:false}` в `apps/app/app/layout.tsx` (весь сервис + `/p/[token]`).
- ⬜ **schema.org JSON-LD (Organization/SoftwareApplication/FAQPage) — ОТЛОЖЕНО** вместе с текстовыми мета:
  ставится в `layout.tsx`/`page.tsx` лендинга (у соседа). Добавлю при слиянии.
- ⬜ **Google Search Console** — ручной внешний шаг пользователя: зарегистрировать сайт + отправить sitemap
  (после деплоя лендинга). Опц. Yandex Webmaster.
- ✅ **Задание 3.2 — юр-страницы:** `/privacy` `/terms` `/cookies` (`apps/landing/app/*/page.tsx`) +
  каркас `app/_legal/LegalShell.tsx`, на бренд-токенах. Оператор обезличенно («владелец axon-app.ru»),
  контакт `hello@axon-app.ru`, язык русский (152-ФЗ). Добавлены в sitemap. **Отложено у соседа:** ссылки
  футера (сейчас `href="#"`), cookie-баннер, чекбокс согласия в форме регистрации (apps/app).
- 🟡 **Задание 3.1 — аналитика: выбрана Яндекс.Метрика.** Счётчик создан, **ID `110037189`** (в
  `apps/landing/.env.local` → `NEXT_PUBLIC_YM_ID`, gitignored; ID не секрет — встраивается в публичный HTML).
  ✅ обёртка `apps/landing/lib/analytics.ts` (`trackEvent` + цели cta_click/signup_start/signup_complete).
  **Отложено у соседа:** скрипт счётчика в `layout.tsx` (грузить ТОЛЬКО после согласия cookie-баннера),
  сам cookie-баннер, вызовы `trackEvent` в местах событий (CTA — `page.tsx`; signup — `apps/app`).
**СЛЕДУЮЩАЯ СЕССИЯ (после обеда 2026-06-21) — начать отсюда:**
Соседний чат ЗАКОНЧИЛ и ЗАКОММИТИЛ дизайн секций — коммит `899aa16` (`page.tsx`, `globals.css`,
`_axon/PrototypeShowcase.tsx`). Общие файлы ЧИСТЫЕ → **«пакет на соседа» РАЗБЛОКИРОВАН, ничего не ждёт.**
(2-я секция FEATURES намеренно не доделана — это не блокер для пунктов ниже.) Перед правкой всё равно
быстро глянь `git status` — нет ли новых незакоммиченных правок.
1. **«Пакет на соседа»** (всё ждало `layout.tsx`/`page.tsx`):
   - текстовые мета Шага 2 — `layout.tsx` лендинга: title 50–60, description 140–160, metadataBase,
     **og:title = «From data to story, in minutes»** (финал, согласовано 2026-06-21);
   - **schema.org JSON-LD** (Organization / SoftwareApplication + FAQPage из FAQ) — GEO;
   - ссылки футера `page.tsx` на `/privacy` `/terms` `/cookies` (сейчас `href="#"`);
   - **cookie-баннер** (грузит Метрику только после «Принять»);
   - **скрипт Яндекс.Метрики** (ID `NEXT_PUBLIC_YM_ID=110037189`, через next/script, consent-gated);
   - вызовы `trackEvent` (обёртка уже есть: `apps/landing/lib/analytics.ts`): CTA → `page.tsx`, signup → `apps/app`;
   - чекбокс согласия со ссылками на `/terms` `/privacy` в форме регистрации (`apps/app`);
   - **микрокопия «Made for focused desktop work»** под Hero-CTA (и опц. у финального CTA) — мягко
     предупредить, что сервис десктоп-онли (на мобиле `DesktopOnlyNotice` перекрывает воркспейс, как Figma).
1а. **Вычитка текста — `/avoid-ai-writing`:** когда все тексты лендинга финальны (мета + микрокопия +
   правки соседа) — прогнать скилл `/avoid-ai-writing` (профиль `landing`) по текстам лендинга, показать
   diff. Делать ДО деплоя, чтобы публиковать уже вычищенный от AI-штампов текст.
2. **Шаг 4 — PWA: ПРОПУЩЕН** (решение пользователя + соседнего чата 2026-06-21). AXON — десктоп-инструмент
   (работа за компьютером), разбор файлов синхронный → пушить нечего; офлайн/иконка дают мало. По уроку
   Шаг 4 необязателен. Минимальный вариант (иконка+манифест, без пушей) — опционально позже, см. `backlog.md`.
3. **Починить МЕХАНИЗМ деплоя ЗАРАНЕЕ** (не в цейтноте — самая рискованная часть, трогает прод):
   снять стоп-кран `exit 1` в `deploy.sh`/`deploy-remote.sh`; раздельные деплой-юниты лендинг/сервис;
   новые монорепо-пути в Docker/compose/скриптах; `outputFileTracingRoot` для standalone. См. infrastructure.md.
4. **ДЕПЛОЙ — в самом конце**, когда всё собрано и проверено локально (публикуем один раз готовое,
   а не катаем полусырое): лендинг + сервис раздельными юнитами, nginx лендинг на `/`.
5. **Живые проверки — ТОЛЬКО после деплоя:** OG-превью в Telegram + opengraph.xyz; Google Search Console +
   отправка sitemap. (Установка PWA на телефоне отпадает — Шаг 4 пропущен.)
6. **Шаг 5 — финальный адаптив** (вкл. ~760px горизонтальный скролл — заметка соседа в `backlog.md`).
7. Закрытие урока — `/save-session` (slug `lesson-06-package`).
Внешние шаги пользователя: проверить приём `hello@axon-app.ru`; Google Search Console (после деплоя); пуш.
**Решение по таймингу деплоя (2026-06-21):** механизм деплоя чиним заранее (де-риск), саму публикацию —
в конце; часть проверок (OG/Telegram, GSC, PWA на телефоне) возможна только после деплоя → идут последними.

**Запуск dev:** `cd development && npm run dev -w axon-landing -- -p 3002` (сервис — `-w apps/app -- -p 3001`).

**Урок 4 (бэкенд) — завершён.** Сделано: база данных + Prisma, вход в аккаунт (Better Auth:
регистрация/логин/защита/удаление), письма (Resend), хранилище файлов (Selectel S3), разбор
CSV/Excel → инсайты, добавление файла на холст, публичные ссылки `/p/[token]`.

**Проверки пройдены:**
- Смоук сервиса — `docs/audits/persistence-check-2026-06-17.md`.
- Security-check, IDOR на 2 аккаунтах — `docs/audits/security-check-2026-06-17.md`.
- Code-review бэкенда (3 фикса: усечение CSV, евро-числа, сортировка ряда; починен ESLint).

**Готов к Уроку 5:** спецификации экранов + тест-кейсы.

## Бэклог
Полный список — `docs/backlog.md`. Кратко:
- **Фича (отложена):** центр уведомлений in-app — строим, когда появится первое
  асинхронное событие (ИИ-разбор файла). Сейчас уведомлять нечего.
- **UX:** предупреждение об усечении файла; двунаправленная связь инсайт↔датасет.
- **Тулинг:** lint-уборка (36 замечаний в UI), вернуть lint в сборку, обновить @react-email, npm audit.
- **Полировка:** письма, hydration #418, i18n auth-экранов, orphan-аватар при удалении.
- **Уборка (конец урока):** корневой мусор; опц. FSD-рефактор.

## Ключевые файлы
- `prisma/schema.prisma` — схема БД · `lib/db.ts` — Prisma client
- `lib/auth.ts` + `lib/auth-client.ts` — вход · `app/api/auth/[...all]/route.ts`
- `lib/email.ts` + `emails/` — письма · `lib/storage.ts` + `app/api/files`, `app/api/avatar` — файлы
- `app/actions/board.ts`, `app/actions/share.ts` — server-actions (доски, шаринг)
- `app/p/[id]/` — публичная дека · `lib/store.ts` — состояние холста
- `lib/file-parsing/`, `lib/insight-engine/` — разбор файла → холст

## Доступы (ENV — в `.env*`, не в git)
- `DATABASE_URL` — dev: Neon (облако); prod: Postgres в docker (`.env.production`).
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` — **разные** в dev и prod.
- `RESEND_API_KEY` — только prod (локально письма не шлём).
- `S3_*` — Selectel Object Storage (endpoint/region/ключи/бакет).
