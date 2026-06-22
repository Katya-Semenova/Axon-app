# Сессия 2026-06-22 — Урок 6: пакет (мета/GEO/аналитика) + механизм деплоя + адаптив

## Итог: Урок 6 продвинут сильно, НО НЕ закрыт. Осталось: топология nginx → деплой → проверки на проде → закрытие.
Сессия была нестабильной: дважды зависал Mac пользователя (`fork/posix_spawn: Resource temporarily
unavailable`) из-за dev-сервера Next + голосового ввода Spokenly → перегрузка процессов, перезагрузки.
**Вся работа в git цела.** Коммиты сессии: `bbf0d4c`…`91e64c8`.

## 1. Уборка дерева
- Закоммичен накопленный `docs/landing-brief.md` (работа бриф-чата) — `bbf0d4c`.
- `.gitignore` + удалены 44 PNG-черновика дизайн-итераций из корня + `brand/_previews/` — `b0dcbec`.

## 2. «Пакет» (мета + GEO + согласие + аналитика) — ЗАВЕРШЁН (`e489ef9`…`ac5ff64`)
- **Текстовые мета** (`apps/landing/app/layout.tsx`): title 52 симв., description 154, `metadataBase`,
  og:title/twitter = «From data to story, in minutes».
- **JSON-LD**: Organization + SoftwareApplication (`layout.tsx`); FAQPage с НОВОЙ видимой секцией `#faq`
  (`page.tsx`, 5 Q&A в `<details>`, один массив `FAQS` — вариант А, согласован).
- **Ссылки футера** → `/privacy` `/terms` `/cookies` + Contact `mailto:hello@axon-app.ru` (убран Blog).
- **Cookie-баннер** `apps/landing/app/_components/CookieConsent.tsx` (бренд-классы) + consent-gated
  **Яндекс.Метрика** через `next/script` ТОЛЬКО после «Accept» (webvisor off). То же в сервисе:
  `apps/app/app/_components/Analytics.tsx` + `apps/app/lib/analytics.ts` (общий localStorage, один домен).
- **trackEvent**: 5×`cta_click` на кнопках «Try Axon» + CTA переведены на `/app` (был петлевой `axon-app.ru/`);
  `signup_start/complete` в `apps/app/app/register/page.tsx`.
- **Чекбокс согласия** (`/terms` `/privacy`) в форме регистрации — блокирует кнопку.
- **Микрокопия** «Made for focused desktop work» под Hero-CTA.
- **ENV:** `NEXT_PUBLIC_YM_ID=110037189` в `apps/app/.env` (dev) + `.env.example`. ⚠️ NEXT_PUBLIC_* впекается
  НА СБОРКЕ → нужен в `.env.production` И как build-arg (см. compose). Без него аналитика на проде молчит.
- 📌 Флаг: `apps/app/components/AuthModal.tsx` (модалка-регистрация) — БЕЗ чекбокса/трекинга. Решить позже.

## 3. Вычитка `/avoid-ai-writing` (профиль landing) — СДЕЛАНА, правок нет
Прогнал весь текст лендинга. Копирайт соседнего чата чистый, AI-штампов нет. Фабриковать diff не стал.
Две бренд-строки на метафоре «neural» (футер + Features-заголовок) — пользователь решил ОСТАВИТЬ.

## 4. Механизм деплоя — ПОЧИНЕН (`edeac1e`…`803528f`). Проверить вживую нельзя (нет Docker/VPS).
Монорепо ломало старый рецепт (код в `development/apps/*`, а Docker/compose на старых путях).
- `outputFileTracingRoot` = корень workspace в обоих `next.config.ts`; лендингу добавлен `output:standalone`.
  Проверено сборкой: лендинг-standalone стартует, `server.js` в `apps/<app>/`, HTTP 200.
- Два монорепо-Dockerfile'а (`apps/app`, `apps/landing`), контекст сборки `development/` + `.dockerignore`.
- `docker-compose.yml` → 3 юнита: `landing` (3001) + `web` (3000) + `db`; build-arg `NEXT_PUBLIC_YM_ID`;
  память 256/448/256 под бокс 1 ГБ. Старый корневой `Dockerfile` удалён.
- `deploy.sh`/`scripts/deploy-remote.sh`: снят стоп-кран `exit 1`; путь миграций Prisma → `apps/app/prisma`.
- Рецепт + nginx-черновик — в `docs/memory/infrastructure.md`.
- ⚠️ **ОТКРЫТО — топология `/_next`:** оба Next-приложения отдают ассеты под `/_next/` → делить по пути
  в nginx нельзя без `basePath:'/app'` на сервисе ИЛИ поддомена `app.` (ADR-010 детали отложил). ЭТО
  ГЛАВНЫЙ БЛОКЕР деплоя лендинга. Решать в след. сессии.

## 5. Адаптив (Шаг 5) — сделан ПО КОДУ, визуально НЕ проверен (`f1fb98c`, `91e64c8`)
- `body { overflow-x: clip }` — убирает гор. скролл, не ломая `position:sticky` (THE SHIFT). Это и был
  баг из backlog (~760px).
- Секция «Why Axon»: жёсткая сетка `566px 566px` → класс `.why-grid`, < 1180px складывается в столбик
  по центру (minmax 0..566), коробки ужимаются, пиксель-арт обрезается их `overflow:hidden`.
- ⚠️ **НЕ проверено глазами** (Mac не тянет dev-сервер, Playwright в песочнице не достаёт localhost).
  Пользователь ранее отмечал, что секции складываются криво. **Проверять и править — на ПРОДЕ после деплоя.**

## Остаётся (след. сессия, тот же проект)
1. **Топология:** выбрать `basePath:'/app'` (трогает Better Auth callback) ИЛИ поддомен `app.`. Затем nginx.
2. **Деплой** (руками пользователя; у него НЕТ Docker локально → сборка на сервере). Перед: вписать
   `NEXT_PUBLIC_YM_ID` в `.env.production`.
3. **На проде проверить СРАЗУ всё:** адаптив (375/760, с телефона) + OG-превью (Telegram/opengraph.xyz) +
   Google Search Console (sitemap) + приём почты `hello@axon-app.ru`. Чинить по кругу.
4. `/save-session` (вручную — скилла нет) — закрыть Урок 6.

## Важные правила, выявленные в сессии
- **НЕ запускать dev-сервер на машине пользователя** — Mac не тянет (`fork failed`), зависает весь.
  Задачи на рендер делать по исходнику; проверять на задеплоенном сайте. Память: `feedback_one_dev_server`.
- Разовая сборка (`npm run build`) безопасна (завершается); висящий dev-сервер — нет.
