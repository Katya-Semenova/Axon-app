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
- ✅ **schema.org JSON-LD (2026-06-22):** Organization + SoftwareApplication — `layout.tsx`;
  FAQPage — `page.tsx` рядом с новой видимой секцией FAQ (`#faq`, 5 Q&A, `<details>`; вариант А,
  один массив `FAQS` для текста и разметки).
- ⬜ **Google Search Console** — ручной внешний шаг пользователя: зарегистрировать сайт + отправить sitemap
  (после деплоя лендинга). Опц. Yandex Webmaster.
- ✅ **Задание 3.2 — юр-страницы:** `/privacy` `/terms` `/cookies` (`apps/landing/app/*/page.tsx`) +
  каркас `app/_legal/LegalShell.tsx`, на бренд-токенах. Оператор обезличенно («владелец axon-app.ru»),
  контакт `hello@axon-app.ru`, язык русский (152-ФЗ). Добавлены в sitemap. **Отложено у соседа:** ссылки
  футера (сейчас `href="#"`), cookie-баннер, чекбокс согласия в форме регистрации (apps/app).
- 🟡 **Задание 3.1 — аналитика: выбрана Яндекс.Метрика.** Счётчик создан, **ID `110037189`** (в
  `apps/landing/.env.local` → `NEXT_PUBLIC_YM_ID`, gitignored; ID не секрет — встраивается в публичный HTML).
  ✅ обёртка `apps/landing/lib/analytics.ts` (`trackEvent` + цели cta_click/signup_start/signup_complete).
  ✅ **CTA-трекинг (2026-06-22):** все 5 кнопок «Try Axon» в `page.tsx` → `cta_click` (onClick) +
  ссылки переведены на `/app` (ADR-010; был петлевой `axon-app.ru/`). «Book a demo» → `mailto:hello@`.
  ✅ **Cookie-баннер + Метрика (2026-06-22):** `app/_components/CookieConsent.tsx` (бренд-классы) в
  `layout.tsx` — баннer Accept/Decline (решение в localStorage); счётчик YM грузится через `next/script`
  ТОЛЬКО после «Accept» (webvisor выкл.). **Отложено:** signup-цели + согласие в `apps/app`.
**⏯️ RESUME ПОСЛЕ ПЕРЕЗАГРУЗКИ (2026-06-22) — ЧИТАЙ ЭТО ПЕРВЫМ:**
Сессия прервалась НЕ по работе, а технически: я несколько раз запускал dev-сервер лендинга,
осиротевшие node-воркеры забили таблицу процессов macOS → `fork failed: resource temporarily
unavailable` (завис и мой Bash, и терминал пользователя). Пользователь перезагружает Mac. Работа
вся в git, НИЧЕГО не потеряно (последний коммит `803528f`).
**Первым делом в новом чате:**
1. `git status` — возможно, есть НЕЗАКОММИЧЕННЫЕ правки `docs/memory/state.md` (этот хэндофф) —
   закоммить их: `docs(state): хэндофф после перезагрузки`.
2. Проверь, что Bash отвечает (`echo ok`) и нет висящих node: `pgrep -fl "next dev"` (должно быть пусто).
3. **ОСТАНОВИЛИСЬ НА: Шаг 5 — финальный адаптив (см. пункт 6 ниже). Это следующая задача.**
   ⚠️ **КАТЕГОРИЧЕСКИ: НЕ запускать dev-сервер на машине пользователя.** Выяснено 2026-06-22 (дважды):
   Mac пользователя (mini + голосовой ввод Spokenly, жрёт память) НЕ ТЯНЕТ `next dev` — таблица
   процессов переполняется → `posix_spawn/fork: Resource temporarily unavailable`, зависает ВЕСЬ Mac
   (VS Code не может открыть терминал), спасает только перезагрузка/Force Quit. Плюс **Playwright MCP
   в песочнице НЕ достучался до localhost:3002** (сетевая изоляция, висел на chrome-error). Значит:
   **адаптив делаем ТОЛЬКО по исходнику (Read/Edit, без серверов и Playwright). Пользователь проверяет
   визуально ПОТОМ — на задеплоенном сайте**, ничего локально не поднимая.
   ✅ Уже сделано: глобальная защита `body { overflow-x: clip }` (коммит `f1fb98c`) — убирает сам
   гор. скролл, не ломая `position:sticky` (THE SHIFT). **Осталось:** мобильная РАСКЛАДКА.
   Кандидат №1 (ригидный): секция «Why Axon» (`page.tsx` ~404) — grid `566px 566px` (=1152px фикс) +
   две коробки 775px с абсолютным пиксель-артом, `flexShrink:0` (не сжимаются) → на узком экране
   обрезается. Нужен мобильный столбик/упрощение < md. Остальные секции на адаптивных Tailwind-классах.

**Что уже сделано в Уроке 6 (НЕ повторять):**
Соседний чат закоммитил дизайн (`899aa16`). Пакет + вычитка + механизм деплоя — ГОТОВЫ (детали ниже).
1. **✅ «Пакет» — ЗАВЕРШЁН 2026-06-22** (коммиты `e489ef9`…`ac5ff64`):
   - ✅ текстовые мета + og:title «From data to story, in minutes» (`layout.tsx`);
   - ✅ JSON-LD Organization/SoftwareApplication (`layout.tsx`) + FAQPage с видимой секцией `#faq` (`page.tsx`);
   - ✅ ссылки футера → `/privacy` `/terms` `/cookies` + Contact `mailto:`;
   - ✅ cookie-баннер `CookieConsent.tsx` + consent-gated Я.Метрика (лендинг и сервис, общий localStorage);
   - ✅ `trackEvent`: 5×`cta_click` + CTA→`/app`; `signup_start/complete` в `apps/app/register`;
   - ✅ чекбокс согласия (`/terms` `/privacy`) в форме регистрации, блокирует кнопку;
   - ✅ микрокопия «Made for focused desktop work» под Hero-CTA.
   - ⚠️ **ENV:** `NEXT_PUBLIC_YM_ID=110037189` добавлен в `apps/app/.env` (dev) и `.env.example`;
     **на проде вписать в `apps/app/.env.production`** — иначе signup-цель молчит.
   - 📌 **Флаг (не сделано намеренно):** `apps/app/components/AuthModal.tsx` — модалка-регистрация
     (вкладка register) БЕЗ чекбокса согласия и signup-трекинга. Решить: добавить туда то же
     (нужны i18n-ключи) или оставить только основную форму `register/page.tsx`. Спросить пользователя.
1а. **✅ Вычитка `/avoid-ai-writing` — СДЕЛАНА 2026-06-22.** Прогнал весь текст лендинга (профиль
   `landing`). Вердикт: копирайт соседнего чата чистый, AI-штампов нет; правок НЕ вносил (фабриковать
   diff не стал). Две бренд-строки на метафоре «neural» (футер «The Neural Network for Your Data
   Narrative» + Features-заголовок «Everything the neural connection needs») — пользователь решил
   ОСТАВИТЬ как есть (намеренный бренд-голос, не AI-слоп). Коммитов нет (изменений в коде нет).
2. **Шаг 4 — PWA: ПРОПУЩЕН** (решение пользователя + соседнего чата 2026-06-21). AXON — десктоп-инструмент
   (работа за компьютером), разбор файлов синхронный → пушить нечего; офлайн/иконка дают мало. По уроку
   Шаг 4 необязателен. Минимальный вариант (иконка+манифест, без пушей) — опционально позже, см. `backlog.md`.
3. **✅ МЕХАНИЗМ деплоя — ПОЧИНЕН 2026-06-22** (`edeac1e`…`3bfaef5`): `outputFileTracingRoot` +
   landing `standalone`; два монорепо-Dockerfile'а (контекст `development/`) + `.dockerignore`;
   compose на 3 юнита (landing 3001 / web 3000 / db); снят `exit 1`; путь миграций Prisma обновлён;
   `NEXT_PUBLIC_YM_ID` как build-arg. Лендинг-standalone проверен живьём (HTTP 200). Рецепт +
   nginx-черновик — в `infrastructure.md`. **Проверить здесь нельзя (нет Docker/VPS).**
   ⚠️ **Открыто (на сервере):** маршрутизация `/_next` при делении лендинг/сервис по пути —
   нужен `basePath:'/app'` или поддомен (ADR-010 отложил); `.env.production` ← добавить `NEXT_PUBLIC_YM_ID`.
4. **ДЕПЛОЙ — в самом конце** (публикуем готовое). Делает пользователь руками: `./scripts/deploy-remote.sh`.
   ⚠️ **На Mac пользователя НЕ установлен Docker** (`command not found: docker`) — локальная проверка
   сборки невозможна без установки Docker Desktop; сборка всё равно идёт на сервере при деплое (если
   build падает — старые контейнеры живут, прод не ломается). Перед публикацией: вписать
   `NEXT_PUBLIC_YM_ID` в серверный `.env.production` + решить nginx `/_next` (basePath/поддомен).
5. **Живые проверки — ТОЛЬКО после деплоя:** OG-превью в Telegram + opengraph.xyz; Google Search Console +
   отправка sitemap. (Установка PWA на телефоне отпадает — Шаг 4 пропущен.)
6. **◀ СЛЕДУЮЩАЯ ЗАДАЧА: Шаг 5 — финальный адаптив** (делать ДО деплоя — публикуем готовое).
   Цель: на 375px и в ландшафте ничего не торчит, НЕТ горизонтального скролла. Известный баг —
   гор. скролл на ~760px (заметка в `backlog.md`, секция #prototype при этом ОК, причина в другой).
   Как искать/чинить безопасно — см. блок «RESUME ПОСЛЕ ПЕРЕЗАГРУЗКИ» выше (один dev-сервер + Playwright).
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
