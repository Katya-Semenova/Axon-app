"use server";

/**
 * Server-actions админки (Урок 5, Шаг 2) — read-only owner-панель v1.
 * Каждое действие ПЕРВОЙ строкой вызывает requireAdmin() — не-админ получает
 * исключение, данные не утекают (authz-защита, как IDOR в board.ts). Ничего не
 * пишет/не удаляет (v1 read-only). Email-фильтр идёт параметром Prisma (без инъекций).
 */
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export interface AdminMetrics {
  users: number;
  boards: number;
  newUsers7d: number;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  boardCount: number;
}

export interface AdminUserBoard {
  id: string;
  title: string;
  updatedAt: string;
  shared: boolean;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  boards: AdminUserBoard[];
}

/** Мини-сводка для шапки списка: всего юзеров, всего досок, новых за 7 дней. */
export async function adminGetMetrics(): Promise<AdminMetrics> {
  await requireAdmin();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [users, boards, newUsers7d] = await Promise.all([
    prisma.user.count(),
    prisma.board.count(),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
  ]);
  return { users, boards, newUsers7d };
}

/** Список пользователей (новые сверху). Поиск по имени/email (регистронезависимо). */
export async function adminListUsers(query?: string): Promise<AdminUserRow[]> {
  await requireAdmin();
  const q = query?.trim();
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: { select: { boards: true } },
    },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt.toISOString(),
    boardCount: u._count.boards,
  }));
}

/** Детали пользователя + его доски (метаданные, read-only). null — если нет. */
export async function adminGetUser(id: string): Promise<AdminUserDetail | null> {
  await requireAdmin();
  const u = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      createdAt: true,
      boards: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          updatedAt: true,
          _count: { select: { shareLinks: true } },
        },
      },
    },
  });
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt.toISOString(),
    boards: u.boards.map((b) => ({
      id: b.id,
      title: b.title,
      updatedAt: b.updatedAt.toISOString(),
      shared: b._count.shareLinks > 0,
    })),
  };
}
