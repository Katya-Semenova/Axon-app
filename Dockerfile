# syntax=docker/dockerfile:1
# Многоэтапная сборка Next.js (standalone) для продакшена на VPS.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# npm install (не ci): терпим к мелким расхождениям lock между разными версиями npm
RUN npm install --no-audit --no-fund

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
# standalone-сборка: сервер + минимальные зависимости
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
