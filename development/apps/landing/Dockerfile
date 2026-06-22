# syntax=docker/dockerfile:1
# Образ ЛЕНДИНГА (apps/landing, Next 16) для монорепо.
# Контекст сборки = папка development/.
# Ручная сборка:  cd development && docker build -f apps/landing/Dockerfile -t axon-landing .

FROM node:20-alpine AS builder
WORKDIR /repo
COPY . .
RUN npm install --no-audit --no-fund
# ID счётчика Я.Метрики впекается на сборке (NEXT_PUBLIC_*). Не секрет; из compose build.args.
ARG NEXT_PUBLIC_YM_ID
ENV NEXT_PUBLIC_YM_ID=${NEXT_PUBLIC_YM_ID}
RUN npm run build -w axon-landing

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
# standalone содержит apps/landing/server.js + общий node_modules в корне коробки.
COPY --from=builder --chown=nextjs:nodejs /repo/apps/landing/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/landing/.next/static ./apps/landing/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/landing/public ./apps/landing/public
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/landing/server.js"]
