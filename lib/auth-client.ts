/**
 * Better Auth — клиент для React-компонентов (Урок 4, Шаг 5).
 * Используется на экранах входа/регистрации и в шапке.
 */
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
