# Infrastructure — Axon

> Снимок production-инфраструктуры. Обновлять при крупных изменениях.
> Пароли/ключи сюда НЕ писать — здесь только адреса, имена, пути, структура.
> Реальность с 2026-06-15: **свой VPS (Selectel) + Docker + nginx + домен**.
> Переезд с Vercel — см. [ADR-002](decisions/ADR-002-hosting-migration.md).

## Обзор (одной строкой)
Next.js-фронтенд в Docker-контейнере на **российском VPS (Selectel)**, наружу через **nginx**,
свой домен **axon-app.ru**. Бэкенда/БД/секретов пока нет. Старый Vercel ещё жив как
подстраховка на время переезда (гасим после проверки стабильности).

## Хостинг (VPS Selectel) — основной
- Провайдер: **Selectel** (облачный сервер; аккаунт оформлен через родственника)
- IP: **176.114.91.231**
- Зона: ru-7a (Москва)
- ОС: Ubuntu 24.04 LTS
- Ресурсы: 1 vCPU (Shared) / 1 ГБ RAM / диск 15 ГБ (SSD v2) + swap 2 ГБ (swappiness=10)
- Путь проекта на сервере: `/var/www/axon-app/`

## Старый хостинг (Vercel) — подстраховка, временно
- Прод-URL (пока жив): https://axon-app-chi.vercel.app/
- Авто-деплой по push в `main` (всё ещё работает).
- **Будет погашен** после нескольких дней стабильной работы VPS с HTTPS (Фаза 5, п.3).

## Домен (Timeweb)
- Домен: **axon-app.ru** (регистратор — Timeweb)
- Автопродление: вкл. WHOIS-приватность (скрытие данных администратора): вкл.
- NS: ns1–4.timeweb.ru/org
- DNS-записи: `A @ → 176.114.91.231`, `A www → 176.114.91.231`
- TXT/MX — почта Timeweb, не трогаем.

## HTTPS
- Let's Encrypt через **Certbot** (`--nginx`), авто-продление (`certbot.timer`).
- ⏳ Статус 2026-06-15: сертификат ещё НЕ выпущен — ждём распространения DNS нового домена.
  Повторить: `certbot --nginx -d axon-app.ru -d www.axon-app.ru` когда домен начнёт публично резолвиться.

## Код (GitHub) и доставка на сервер
- Репозиторий: `git@github.com:Katya-Semenova/Axon-app.git` (по SSH)
- Главная ветка (= прод): `main`
- Доставка на сервер — **rsync с Mac** (не git pull на сервере; deploy key не заводили):
  - Локально: `./scripts/deploy-remote.sh` (читает доступ из `.env.deploy`, делает rsync + удалённую сборку).
  - На сервере: `/var/www/axon-app/deploy.sh` (`docker compose up -d --build` + чистка кэша сборок).
- История git = бэкап кода.

## Docker
- Один сервис **web**: Next.js standalone, слушает `127.0.0.1:3000` (наружу — только через nginx).
- `mem_limit: 512m`, `restart: unless-stopped`, healthcheck.
- Образ собирается на сервере (`npm install` + `next build`); на 1 ГБ помогает swap.
- Ротация логов Docker: max-size 10m, max-file 3.
- Файлы в репо: `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `next.config.ts` (`output: "standalone"`).

## nginx
- Конфиг: `/etc/nginx/sites-available/axon-app` (symlink в `sites-enabled/`)
- Reverse-proxy `→ 127.0.0.1:3000`, `server_name axon-app.ru www.axon-app.ru`
- После выпуска сертификата Certbot добавит блок 443 + редирект http→https.
- TODO (полировка после cert): HSTS, кэш `/_next/static/`, 301-редирект www↔apex.

## Безопасность
- Вход на сервер: **только по SSH-ключу** (`~/.ssh/id_ed25519`); пароль отключён
  (`PasswordAuthentication no`, `PermitRootLogin prohibit-password`).
- Файрвол **UFW**: открыты только 22 (SSH), 80, 443.
- **fail2ban**: защита от перебора входа.
- HTTP security-заголовки — в `next.config.ts` (X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy).
- Доступ к серверу — в `.env.deploy` (вне git, права 600). Selectel security group: default.
- Последний аудит приложения: [docs/audits/security-check-2026-06-14.md](audits/security-check-2026-06-14.md) — 🔴=0.

## Секреты / переменные окружения
- **Сейчас НЕТ ни одного** (нет бэкенда/БД/auth; «AI» = `lib/mockData.ts` — демо на клиенте).
- Когда появятся (Урок 4): значения → `.env.production` на сервере (600, вне git) + копия в **Bitwarden** (НЕ iCloud, НЕ git). Завести `.env.example`.

## Откат (rollback)
- На время переезда подстраховка — **живой Vercel** (если на VPS проблема — можно вернуться).
- На сервере: предыдущая версия = предыдущий коммит (`git checkout <hash>` + пересборка) либо повторный rsync со старого состояния.

## Известные упрощения (осознанные, не баги)
- Доставка кода — rsync с Mac, а не git pull на сервере (можно перейти на read-only deploy key позже).
- В Dockerfile `npm install`, а не строгий `npm ci` (разница версий npm: 11 на Mac / 10 в контейнере).
- Вход root по ключу без отдельного sudo-пользователя.

## Что дальше
- **Остаток Фазы 5:** выпустить сертификат (как DNS разойдётся) + погасить Vercel после проверки стабильности.
- **Урок 4:** PostgreSQL контейнером в этом же docker-compose, аккаунты/auth, бэкап БД → появятся секреты.
- Опционально: вынести сборку образа с сервера (CI/GHCR), zero-downtime (blue-green).
