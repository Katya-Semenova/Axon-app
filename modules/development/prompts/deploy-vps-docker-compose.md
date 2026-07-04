# Деплой на VPS: docker-compose + deploy.sh

> Универсальный модуль библиотеки. Происхождение: курс vibecoding, урок 03 (обезличено 2026-07-04).

> **Цель:** на сервере крутится docker-compose с Next.js контейнером, приложение уже открывается по `http://<SERVER_IP>` через лёгкий nginx — ещё до домена и HTTPS. `deploy.sh` обновляет код одной командой. Локально `./scripts/deploy-remote.sh` триггерит деплой по SSH.
> Базовый дефолт ниже использует `git pull` внутри `deploy.sh`. Если в ADR о стратегии деплоя выбран другой способ, адаптируй шаги под него: главное — сохранить одну повторяемую команду `deploy.sh`, которую можно запустить вручную или через AI/SSH.

---

## Промт

```
Подними моё приложение на VPS через docker-compose. Данные доступа к серверу я
в чат не ввожу и в терминал ничего не набираю: ты сам подключаешься по SSH и
делаешь всё, читая доступы из файла .env.deploy.

Перед началом прочитай docs/memory/decisions/ADR-<N>-deploy-strategy.md, если он есть.
Если там выбран не git-based деплой, адаптируй шаги под выбранный вариант.

ШАГ 0 — Подготовь файл доступа к серверу.

Если в проекте ещё нет .env.deploy, создай .env.deploy по шаблону с
плейсхолдерами (значения я впишу сам прямо в файл, не в чат):

  SERVER_IP=
  SERVER_USER=root            # на свежем VPS провайдер обычно даёт root
  SERVER_PASSWORD=            # первичный пароль от провайдера (временно — пока не настроим ключ)
  SSH_KEY_PATH=~/.ssh/id_ed25519   # мой локальный ключ; публичную часть ты поставишь на сервер
  GITHUB_URL=                 # подставишь сам из git remote, см. ниже
  DOMAIN=

На свежем VPS у меня пока нет ничего, кроме того, что выдал провайдер: IP, имя
пользователя (обычно root) и пароль. SSH-ключа на сервере ещё нет. Поэтому первый
вход — по паролю, а ключ ты поставишь сам (ШАГ 0.5). Порт приложения по умолчанию
3000 (дефолт Next.js); если моё приложение слушает другой порт — подставляй именно
его одинаково в Dockerfile, docker-compose.yml, nginx и проверках curl.

GITHUB_URL у меня НЕ спрашивай — репозиторий уже подключён при настройке Git.
Возьми адрес сам и впиши в .env.deploy:
  git remote get-url origin
Если вернулась https-форма, а тянуть на сервере будем по SSH — приведи к виду
git@github.com:<user>/<repo>.git. Если remote ещё не настроен — только тогда
попроси меня.

Скажи мне: «открой .env.deploy и впиши SERVER_IP, SERVER_USER (root по умолчанию),
SERVER_PASSWORD (и DOMAIN, если уже есть)». GITHUB_URL ты подставишь сам.
Добавь .env.deploy в .gitignore (если ещё не добавлен) и поставь права 600.

После того как я заполню .env.deploy, прочитай его. Значения мне в чат не выводи.
Также спроси меня одной строкой: код обновляем через GitHub/git pull или другим
способом (если в ADR это ещё не зафиксировано)?

ШАГ 0.5 — Первый вход по паролю и установка SSH-ключа.

На сервере ключа ещё нет, есть только пароль. Подключись по паролю ОДИН раз и сразу
поставь мой ключ — дальше работай уже по ключу, не по паролю:
1. Если у меня ещё нет ~/.ssh/id_ed25519 — сгенерируй (ssh-keygen -t ed25519).
2. Скопируй мой публичный ключ на сервер (sshpass, чтобы не вводить пароль руками;
   поставь sshpass сам, если его нет):
   sshpass -p "$SERVER_PASSWORD" ssh-copy-id -i <SSH_KEY_PATH>.pub <SERVER_USER>@<SERVER_IP>
3. Проверь вход по ключу (должен пустить БЕЗ пароля). Дальше в этом промте
   подключайся только по ключу.
Полное отключение входа по паролю, запрет root-логина, fail2ban и UFW делаем
отдельно — в промте про безопасность сервера (server-security-basics.md).
SERVER_PASSWORD оттуда ещё понадобится, поэтому пока его из .env.deploy не удаляй.

ШАГ 1 — Подключись по ключу (читая доступ из .env.deploy) и установи зависимости на сервере:
- docker и docker-compose plugin (на Ubuntu: apt-get install docker.io docker-compose-plugin)
- git
- curl

ШАГ 1.2 — Сразу настрой Docker и память (одноразово, на слабом VPS критично):

1. Ротация логов Docker. По умолчанию Docker пишет логи контейнеров в json-file
   БЕЗ лимита — за недели они вырастают до гигабайтов и забивают диск, а на полном
   диске падают и сборки, и контейнеры. Ограничь размер в /etc/docker/daemon.json:

     { "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3" } }

   sudo mkdir -p /etc/docker && sudo tee /etc/docker/daemon.json (контент выше),
   затем sudo systemctl restart docker. (Применяется к контейнерам, созданным
   после рестарта.)

2. vm.swappiness=10. На сервере с малой RAM ядро по умолчанию (swappiness=60)
   охотно вытесняет в swap даже горячие страницы работающего приложения — и тогда
   каждый запрос читается с диска, TTFB растёт до секунд. Ставим 10, чтобы swap
   был страховкой на пиках, а не постоянно использовался:

     echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swap.conf
     sudo sysctl -p /etc/sysctl.d/99-swap.conf

ШАГ 2 — На сервере создай папку проекта (подставляя значения из .env.deploy):
sudo mkdir -p /var/www/<project-name>
sudo chown <SERVER_USER>:<SERVER_USER> /var/www/<project-name>
cd /var/www/<project-name>

Репо приватный, поэтому серверу нужен доступ к нему на ЧТЕНИЕ. Настрой это сам по
принципу минимальных прав — через read-only deploy key (не мой личный ключ и не
широкий PAT: серверу хватает чтения одного репо). Это и есть «связать git с
сервером»:
1. На сервере сгенерируй отдельный ключ:
   ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""
2. Добавь его публичную часть в репо как deploy key с доступом ТОЛЬКО на чтение:
   через gh —
     gh repo deploy-key add ~/.ssh/deploy_key.pub --title "vps-<project-name>"
   (без флага -w = read-only), либо покажи мне ~/.ssh/deploy_key.pub и попроси
   вставить её в Settings → Deploy keys репозитория (действие в браузере).
3. Пропиши на сервере ~/.ssh/config, чтобы git для этого репо использовал
   deploy_key (Host github.com → IdentityFile ~/.ssh/deploy_key).
4. Клонируй по SSH:
   git clone <GITHUB_URL из .env.deploy> .

(Если в ADR выбран не git-based деплой — не клонируй репо на сервер, а предложи
подходящий способ доставки кода/артефактов.)

ШАГ 2.7 — Перед сборкой образа проверь главную страницу `/`.

Открой src/app/page.tsx. Если он БЕЗУСЛОВНО редиректит на /style-guide — это
дев-удобство из этапа UI-кита, и на задеплоенном сайте по IP/домену главная
будет показывать UI-кит, а не продукт (частая путаница «почему открывается
style-guide?»). Исправь:
- если настоящая главная уже собрана (этап экранов) — page.tsx должен быть адаптером
  на неё (import { HomeScreen } from '@/pages/home'), а не редиректом на витрину;
- если главной ещё нет — оберни редирект в dev-only, чтобы прод отдавал заглушку:
    if (process.env.NODE_ENV !== "production") { redirect("/style-guide"); }
Витрина пока остаётся доступной по /style-guide (позже можно закрыть её для прода —
404 на боевом, рабочая в dev). Цель этого шага: по http://<IP> и по домену
открывается приложение, а не UI-кит.

ШАГ 3 — Создай Dockerfile (multi-stage, production-ready):

  # syntax=docker/dockerfile:1
  FROM node:20-alpine AS deps
  WORKDIR /app
  COPY package.json package-lock.json* ./
  RUN npm ci

  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY --from=deps /app/node_modules ./node_modules
  COPY . .
  RUN npm run build

  FROM node:20-alpine AS runner
  WORKDIR /app
  ENV NODE_ENV=production
  RUN addgroup --system --gid 1001 nodejs && \
      adduser --system --uid 1001 nextjs
  COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
  COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
  COPY --from=builder --chown=nextjs:nodejs /app/public ./public
  USER nextjs
  EXPOSE 3000
  ENV PORT=3000 HOSTNAME=0.0.0.0
  CMD ["node", "server.js"]

В next.config.js добавь:
  output: 'standalone',

ШАГ 4 — Создай docker-compose.yml:

  services:
    web:
      build: .
      env_file: .env.production
      ports:
        - "127.0.0.1:3000:3000"   # Только localhost — наружу через nginx
      restart: unless-stopped      # сам перезапустится после падения/перезагрузки сервера
      mem_limit: 512m              # потолок памяти: один контейнер не съест весь бокс
      healthcheck:                 # Docker сам видит, «жив» ли контейнер, и перезапустит
        test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/ >/dev/null 2>&1 || exit 1"]
        interval: 30s
        timeout: 5s
        retries: 3
        start_period: 30s

  # PostgreSQL добавится на этапе работы с БД (со своим mem_limit/healthcheck)

# Почему mem_limit + healthcheck + restart на каждый сервис:
# - mem_limit — на боксе с 1 ГБ один распухший контейнер иначе выест всю RAM, и
#   ОС начнёт вытеснять остальных в swap (тормоза) или ловить OOM. Значения под свой
#   бокс: web ~512m; не ставь слишком мало — упрётся и упадёт.
# - healthcheck + restart: unless-stopped — контейнер сам поднимается после падения,
#   OOM или перезагрузки сервера, без ручного вмешательства.

ШАГ 5 — Создай .env.production на сервере (НЕ в репо):
Подключись по SSH (доступ из .env.deploy), создай в /var/www/<project-name>/
файл .env.production. Базовые значения сгенерируй сам, где можно
(NEXTAUTH_SECRET через openssl rand -base64 32, и т.д.). Если для какого-то
ключа нужно МОЁ значение (которое ты не можешь сгенерировать) — оставь в файле
строку с плейсхолдером (KEY=) и скажи мне, какую строку открыть и заполнить
на сервере. Само значение я в чат не ввожу. После заполнения поставь права:
chmod 600 .env.production

ШАГ 6 — Создай deploy.sh на сервере:

  #!/usr/bin/env bash
  set -euo pipefail
  cd /var/www/<project-name>
  # Если код обновляется не через GitHub, замени эту строку на выбранный способ доставки кода.
  git pull
  docker compose up -d --build

  # --- Пост-деплой гигиена (важно на слабом VPS) ---
  # Почему: docker compose ... --build запускает next build внутри BuildKit. Сборка
  # Next прожорлива по памяти, а BuildKit/dockerd после неё НЕ возвращают память ОС
  # (особенность Go-runtime — освобождённое остаётся в RSS процесса). На 1 ГБ это
  # выедает почти всю RAM → ядро уходит в swap → каждый запрос тормозит (TTFB 1-4с).
  docker builder prune -f                          # чистим кэш сборок (растёт быстро)
  DOCKERD_RSS_MB=$(ps -o rss= -C dockerd 2>/dev/null | awk '{s+=$1} END{print int(s/1024)}')
  if [ "${DOCKERD_RSS_MB:-0}" -gt 250 ]; then       # демон распух после сборки —
    echo "dockerd ${DOCKERD_RSS_MB}MB → перезапуск, чтобы вернуть память ОС"
    sudo systemctl restart docker                   # ⚠️ на секунды перезапускает ВСЕ контейнеры
  fi
  echo "Deployed at $(date)"

  chmod +x deploy.sh

> **Лучшее лечение — не собирать на слабом сервере вообще.** Гигиена выше лечит
> симптом. Радикально проблема решается так: образ собирается в CI (GitHub Actions)
> или локально → пушится в реестр (GHCR) → на сервере только `docker compose pull
> && up -d`. Тогда VPS никогда не делает тяжёлую сборку, dockerd не пухнет, swap не
> нужен даже под деплой, а `systemctl restart docker` (с его простоем) не требуется —
> что особенно важно для blue-green (промт zero-downtime-deploy.md). На 1 ГБ для самого
> ПРИЛОЖЕНИЯ памяти хватает — узкое место только в СБОРКЕ на сервере. Развилку
> «собирать на сервере vs в CI» фиксируем в ADR (промт deploy-strategy-adr.md).

ШАГ 7 — Первый запуск:
./deploy.sh
docker compose ps    # web должен быть Up
docker compose logs --tail=50 web    # проверка что запустилось без ошибок
curl http://127.0.0.1:3000   # должен вернуть HTML (это проверка ИЗНУТРИ сервера)

ШАГ 7.5 — Открой приложение по публичному IP (ещё ДО домена).

Контейнер слушает только 127.0.0.1:3000 — снаружи по IP его пока не видно. Поставь
лёгкий nginx-reverse-proxy, чтобы приложение открывалось по http://<SERVER_IP>
сразу, не дожидаясь домена и HTTPS:

  sudo apt-get install -y nginx
  # Конфиг-заглушка по IP: ловит любой хост (catch-all), проксирует на приложение
  sudo tee /etc/nginx/sites-available/<project-name> > /dev/null <<'NGINX'
  server {
      listen 80 default_server;
      server_name _;
      location / {
          proxy_pass http://127.0.0.1:3000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }
  NGINX
  sudo rm -f /etc/nginx/sites-enabled/default          # убрать дефолтную страницу nginx
  sudo ln -sf /etc/nginx/sites-available/<project-name> /etc/nginx/sites-enabled/
  sudo nginx -t && sudo systemctl reload nginx

Проверь снаружи (с твоей стороны, не с сервера):
  curl -I http://<SERVER_IP>    # 200 от приложения, НЕ дефолтная страница nginx

Этот же конфиг на следующем шаге (домен + HTTPS, промт domain-https-nginx.md) просто
дополнится: `server_name _` заменится на твой домен, а certbot добавит HTTPS.
Контейнер остаётся на 127.0.0.1:3000 — наружу всё идёт через nginx. UFW на этой
стадии ещё не включён (он в промте про безопасность сервера), порт 80 открыт.

ШАГ 8 — Локально создай scripts/deploy-remote.sh (доступ к серверу читает из .env.deploy, не хардкодит):

  #!/usr/bin/env bash
  set -euo pipefail
  set -a; source "$(dirname "$0")/../.env.deploy"; set +a
  ssh -i "${SSH_KEY_PATH/#\~/$HOME}" "$SERVER_USER@$SERVER_IP" "/var/www/<project-name>/deploy.sh"

  chmod +x scripts/deploy-remote.sh

Закоммить scripts/deploy-remote.sh и Dockerfile + docker-compose.yml в проект.

ПОКАЖИ МНЕ:
- На сервере: docker compose ps
- На сервере: curl http://127.0.0.1:3000 | head -20
- Снаружи: curl -I http://<SERVER_IP> | head -5  (200 от приложения через nginx)
- Скажи мне открыть http://<SERVER_IP> в браузере — приложение уже доступно по IP, ещё без домена и HTTPS
- Локально: cat scripts/deploy-remote.sh
```

---

## Edge cases

- Если `output: 'standalone'` ломает существующие маршруты — переключись на классический `npm start` в контейнере (но образ будет тяжелее)
- Если порт 3000 занят на сервере — проверь `ss -tulnp | grep 3000`, либо используй другой порт в docker-compose
- Если `git clone` через https требует ввода логина — настрой SSH deploy key в репо или Personal Access Token
- Если проект деплоится через платформу (Vercel/Render/Railway), этот промт не нужен целиком: используй его только как справку по Docker/VPS или пропусти VPS-часть
