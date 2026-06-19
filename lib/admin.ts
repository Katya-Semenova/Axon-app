import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Гейт админки (Урок 5, Шаг 2) — owner-панель v1.
 * Админ определяется по env `ADMIN_EMAIL` (единственный владелец). Роль в БД
 * (`User.role`) — после Урока 7 (см. docs/backlog.md). Email берём ТОЛЬКО из
 * серверной сессии, не от клиента. `import "server-only"` — модуль не уедет в бандл.
 */

/** Email админа из env (нормализован) или null, если не задан. */
function adminEmail(): string | null {
  const e = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return e ? e : null;
}

/** Принадлежит ли email админу. Регистронезависимо; пустой ADMIN_EMAIL → всегда false. */
export function isAdminEmail(email: string | null | undefined): boolean {
  const admin = adminEmail();
  return !!admin && !!email && email.trim().toLowerCase() === admin;
}

/** Серверная сессия текущего админа, либо null (гость / обычный юзер). */
export async function getAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdminEmail(session.user.email)) return null;
  return session;
}

/**
 * Гейт для admin server-actions: бросает, если вызвал не админ — данные не утекают.
 * Использовать ПЕРВОЙ строкой в каждом admin-действии.
 */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error("FORBIDDEN: admin only");
  return session;
}
