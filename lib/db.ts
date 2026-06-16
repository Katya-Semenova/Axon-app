/**
 * Единый клиент Prisma для всего приложения (singleton).
 *
 * В dev-режиме Next.js перезагружает модули на каждом изменении (HMR); без
 * этого паттерна создавалось бы много подключений к базе. Поэтому держим один
 * экземпляр на глобальном объекте.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
