/**
 * Единая точка auth-API (Урок 4, Шаг 5).
 * Better Auth сам обслуживает /api/auth/* (sign-up, sign-in, sign-out, session…).
 */
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
