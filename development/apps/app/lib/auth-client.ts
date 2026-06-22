/**
 * Better Auth — клиент для React-компонентов (Урок 4, Шаг 5).
 * Используется на экранах входа/регистрации и в шапке.
 */
import { createAuthClient } from "better-auth/react";
import { BASE_PATH } from "@/lib/base-path";

// Топология /ai-studio (ADR-010): API входа Next отдаёт под `${BASE_PATH}/api/auth`.
// Клиент идёт мимо роутера Next, поэтому путь указываем явно — иначе войти/выйти
// стучались бы в старый `/api/auth` (его на этом домене больше нет).
export const authClient = createAuthClient({
  basePath: `${BASE_PATH}/api/auth`,
});

export const { signIn, signUp, signOut, useSession } = authClient;
