# syntax=docker/dockerfile:1
# Образ СЕРВИСА (apps/app, Next 15) для монорепо.
# Контекст сборки = папка development/ (а не корень репо и не apps/app).
# Ручная сборка:  cd development && docker build -f apps/app/Dockerfile -t axon-web .

FROM node:20-alpine AS builder
WORKDIR /repo
# Весь workspace (node_modules/.next/.env исключены через .dockerignore).
# Нужен целиком: сервис связан с packages/ui (@axon/ui) через workspace.
COPY . .
RUN npm install --no-audit --no-fund
# NEXT_PUBLIC_* впекается в бандл на сборке (не в рантайме) — поэтому ID счётчика
# нужен ИМЕННО здесь. Не секрет; приходит из .env.production через compose build.args.
ARG NEXT_PUBLIC_YM_ID
ENV NEXT_PUBLIC_YM_ID=${NEXT_PUBLIC_YM_ID}
# Кнопка «Попробовать демо» на /login — тоже клиентский флаг, впекается на сборке.
ARG NEXT_PUBLIC_DEMO_ENABLED
ENV NEXT_PUBLIC_DEMO_ENABLED=${NEXT_PUBLIC_DEMO_ENABLED}
# Prisma: клиент генерируем до сборки (заглушка-URL — подключение к базе не нужно).
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate --schema=apps/app/prisma/schema.prisma
# Сборка только сервиса (standalone — см. apps/app/next.config.ts).
# Поднимаем потолок кучи Node на время сборки: на боксе 1 ГБ дефолтный лимит V8
# мал, и next build падал с "JS heap out of memory" (2026-06-27). RAM+swap покрывают.
ENV NODE_OPTIONS=--max-old-space-size=2048
RUN npm run build -w axon-app

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Prisma на alpine требует openssl для движка запроса.
RUN apk add --no-cache openssl
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
# standalone содержит apps/app/server.js + общий node_modules в корне коробки.
COPY --from=builder --chown=nextjs:nodejs /repo/apps/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/app/.next/static ./apps/app/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/app/public ./apps/app/public
# Prisma client + движок запроса (standalone не всегда их трейсит автоматически).
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules/@prisma/client ./node_modules/@prisma/client
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
# server.js лежит внутри standalone по пути apps/app/ (из-за outputFileTracingRoot).
CMD ["node", "apps/app/server.js"]
