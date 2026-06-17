# Security-check — Урок 4, Шаг 13

**Дата:** 2026-06-17 · **Фокус:** auth / IDOR / сессии / инъекции (этап БД+Auth).
**Метод:** аудит кода (server-actions, API-роуты, auth, схема, заголовки) + опора на смоук Шага 10.
**Чек-лист:** [../security-checklist.md](../security-checklist.md).

## Итог: 🟢 критичных дыр НЕ найдено. Переход к следующему этапу разрешён.
Остаток — 🟡 проверки на сервере (секреты/инфра, уходят в Шаг 12) и мелкая полировка (бэклог).

---

## A. Authorization & IDOR 🟢
**Доски** (`app/actions/board.ts`) — все функции гейтят владельца, `ownerId` из серверной сессии:

| Функция | Проверка |
|---|---|
| getBoard / saveBoard / deleteProject / renameProject | `currentUserId()` + `board.ownerId === userId`, иначе `null`/`false` |
| listProjects | `where: { ownerId: userId }` |
| createProject / createProjectFromData | `ownerId: userId` (из сессии, не от клиента) |

- Чужая/несуществующая доска → трактуется как «не найдено» (нет утечки существования). ✅
- **Шаринг** (`app/actions/share.ts`): create/get/revoke — `ownedBoardId()` (только владелец); `getSharedBoard(token)` публичен **by design**, отдаёт урезанную `PublicDeck` (только слайды + их дата-сеты + тема, **без** инсайтов/связей/позиций). ✅
- **API:** `avatar` POST — сессия (401 без неё) + ключ `avatars/${session.user.id}-…` (нельзя залить за другого); `files` GET — только префикс `avatars/` (не секретны). ✅
- **Защита роутов:** `/settings` — серверный гейт `if(!session) redirect("/login")`; `/` — гостевой по дизайну, но данные досок всё равно за gated server-actions; `/p/[id]` — публичный by design. ✅
- **Server Actions ≠ REST** → curl-IDOR из урока неприменим напрямую; точка контроля — `ownerId`-проверка в каждой функции (проверена построчно). Эмпирический 2-аккаунт тест — см. § IDOR-тест.

## B. Inputs & Injection 🟢
- Везде Prisma query-builder; raw SQL (`$queryRaw`/`$executeRaw`/`*Unsafe`) — **нет** (grep чисто). Параметризовано. ✅
- Mass-assignment нет: поля явные, `ownerId` серверный, `title.slice(0,120)`; паттерна `data: req.body` нет. ✅
- Formula-injection (CSV): `neutralizeFormula` на ярлыки и заголовки (insight-engine). ✅
- XSS: рендер через React (автоэкранирование); `dangerouslySetInnerHTML` — **нет** (grep чисто). ✅

## D. CSRF 🟢
- cookie сессии `SameSite=Lax`. Server Actions — встроенная Origin/Host-защита Next 15. Better Auth — встроенная CSRF. `avatar` POST: cross-site POST с Lax-cookie не отправит cookie → защищён. ✅

## E. Authentication / Sessions 🟢 (с заметками)
- Пароли — **scrypt** (Better Auth по умолчанию), memory-hard, ≈/сильнее bcrypt-12. ✅
- Сессии в БД (`Session.expiresAt` в схеме ✅); cookie `HttpOnly` + `Secure`(HTTPS) + `SameSite=Lax`. ✅
- Rate-limit /api/auth/*: sign-in 10/60s, sign-up 5/60s, request/forget-password 3/60s, reset 5/60s, global 100/10s. ✅
- User-enumeration: login → общий «Invalid email or password» ✅; forgot-password → успех всегда ✅.
- 🟡 **sign-up** возвращает ошибку «email занят» → раскрывает существование (типичный компромисс Better Auth) — low.
- 🟡 rate-limit хранится **in-memory** → ок для одного контейнера; при масштабировании на >1 инстанс — внешний стор (Redis/БД).

## F. File uploads 🟢 (урок депрайоритезит, но у нас есть — и сделано хорошо)
- avatar: magic-bytes (PNG/JPEG/WEBP), лимит 2МБ, сессия, ключ от `userId`; отдача с `nosniff`/CSP `default-src 'none'; sandbox`/Content-Disposition. ✅
- CSV/xlsx — лимит 50МБ, разбор **в браузере** (на сервер для парсинга не грузятся). ✅

## H. HTTP security headers 🟢
- `next.config.ts` → на `/:path*`: X-Frame-Options `DENY`, `nosniff`, Referrer-Policy, Permissions-Policy (камера/микро/гео off). ✅
- 🟡 HSTS не в коде — ставит nginx/Certbot на проде (проверить). CSP на HTML-страницы — на будущее (сейчас только на `/api/files`).

## G. Secrets 🟡 (проверить на сервере)
- `.env`/`.env.local` в `.gitignore` ✅; хардкода секретов нет ✅.
- **На проде подтвердить:** `BETTER_AUTH_SECRET` ≥ 32 байт, ≠ dev, не дефолт.

## L. Deployment / Infra 🟡 (проверить на сервере; → infrastructure.md, Шаг 12)
- `DATABASE_URL` прод = Selectel (не dev-Neon). · Postgres 5432 закрыт UFW. · SSH-ключи / fail2ban.

## Прочие наблюдения
- 🟡 `/storybook` публично доступен в проде — данных нет (утечки нет), но это внутрянка; рассмотреть гейт/удаление в проде.
- 🟡 share-token = `cuid` (неугадываем на практике); при необходимости строже — crypto-random.
- ℹ️ Рассинхрон доки: CLAUDE.md пишет «5 login/min», код — 10/60s. Выровнять текст (не баг).

---

## Действия
**🔴 Критичные:** нет.

**🟡 На сервере (в рамках Шага 12 / инфра):**
1. Подтвердить `BETTER_AUTH_SECRET` (≥ 32 байт, ≠ dev, не дефолт).
2. Подтвердить `DATABASE_URL` прод = Selectel; 5432 закрыт UFW; HSTS от nginx/Certbot.

**Опционально (полировка → бэклог):**
3. `/storybook` — гейт/убрать в проде.
4. sign-in rate 10→5/мин (ближе к рекомендации урока); страничный CSP.
5. sign-up enumeration — если важно: generic-ответ / email-верификация.

---

## IDOR — эмпирический тест (§ урока «ОСОБОЕ ВНИМАНИЕ»)
**Статус: ✅ по коду + ✅ эмпирически на двух аккаунтах.**
По коду — каждый путь доступа к доске/ссылке гейтит `ownerId` из серверной сессии; чужое → «не найдено». `ownerId` никогда не приходит от клиента.

**Эмпирический тест (2026-06-17, локально, аккаунты A и B):** доски — это Server Actions (не REST), поэтому проверено реплеем server-action запросов с подменой сессии — идентичный запрос, разные cookie:

| Запрос | Под A (владелец) | Под B (чужой) |
|---|---|---|
| `getBoard(boardId_A)` | 200, полная доска (9902 б, есть `snapshot`) | **`null`** (67 б) |
| `saveBoard(boardId_A, {тема→"HACKED"})` | — | **`false`** |

После попытки записи под B доска A перечитана под A: тема осталась `editorial`, маркера `HACKED` нет, размер не изменился → **подмена не прошла** (не просто `false`-ответ — данные физически нетронуты). Позитивный контроль (тот же запрос под A отдаёт данные) исключает ложный результат из-за кривого запроса. Тест-аккаунты удалены (`delete-user`, каскад; повторный вход → 401).

✅ **IDOR проверен на двух тестовых аккаунтах — не пробивается** (ни чтение, ни запись чужой доски).

## Вердикт
🟢 **Критичных уязвимостей не найдено.** Auth, IDOR, сессии, инъекции, заголовки — закрыты на уровне кода. Открытое — 🟡 проверки секретов/инфры на сервере (Шаг 12) и мелкая полировка (бэклог). Этап считается безопасным для перехода дальше.
