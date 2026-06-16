/**
 * Better Auth — серверная конфигурация (Урок 4, Шаг 5).
 * Вход по email+паролю, без подтверждения email (включим позже на Шаге 6).
 * Пароли хешируются библиотекой (scrypt) — в открытом виде в базе их нет.
 *
 * Секрет берётся из BETTER_AUTH_SECRET (env), адрес — из BETTER_AUTH_URL.
 */
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
});
