"use server";

/**
 * Серверные функции для досок (Урок 4, Шаги 4 и 7).
 * Выполняются на сервере, ходят в базу через Prisma. Клиент вызывает их напрямую.
 *
 * Шаг 7 — доски разведены по пользователям:
 *  - владельца (ownerId) берём ТОЛЬКО из серверной сессии, не от клиента;
 *  - get/save/delete/rename проверяют, что доска принадлежит вошедшему
 *    (IDOR-защита: чужая или несуществующая доска → как «не найдено»).
 */
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { BoardData, ProjectSummary } from "@/lib/types";
import type { Prisma } from "@prisma/client";

/** id вошедшего пользователя из серверной сессии (или null для гостя). */
async function currentUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

/**
 * Прочитать содержимое доски — только если она принадлежит вошедшему.
 * Чужая/несуществующая доска и гость → null (трактуем как «не найдено»).
 */
export async function getBoard(id: string): Promise<BoardData | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  const board = await prisma.board.findUnique({ where: { id } });
  if (!board || board.ownerId !== userId) return null;
  return board.data as unknown as BoardData;
}

/**
 * Сохранить содержимое доски — только владелец.
 * Возвращает true при успехе, false если доски нет или она чужая (тихо игнорируем).
 */
export async function saveBoard(id: string, data: BoardData): Promise<boolean> {
  const userId = await currentUserId();
  if (!userId) return false;
  const board = await prisma.board.findUnique({ where: { id }, select: { ownerId: true } });
  if (!board || board.ownerId !== userId) return false;
  await prisma.board.update({
    where: { id },
    data: { data: data as unknown as Prisma.InputJsonValue },
  });
  return true;
}

/** Список проектов вошедшего пользователя (свежие сверху). */
export async function listProjects(): Promise<ProjectSummary[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  const boards = await prisma.board.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });
  return boards.map((b) => ({ id: b.id, title: b.title, updatedAt: b.updatedAt.toISOString() }));
}

/**
 * Создать новый проект у вошедшего пользователя.
 * Доска создаётся с пустым `data` — демо-сид (wow-данные) клиент наполнит и
 * сохранит при первом открытии (см. BoardSync). Возвращает id или null (гость).
 */
export async function createProject(title?: string): Promise<string | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  const board = await prisma.board.create({
    data: {
      title: (title?.trim() || "Новый проект").slice(0, 120),
      data: {} as Prisma.InputJsonValue,
      ownerId: userId,
    },
    select: { id: true },
  });
  return board.id;
}

/** Удалить проект — только владелец. true при успехе. */
export async function deleteProject(id: string): Promise<boolean> {
  const userId = await currentUserId();
  if (!userId) return false;
  const board = await prisma.board.findUnique({ where: { id }, select: { ownerId: true } });
  if (!board || board.ownerId !== userId) return false;
  await prisma.board.delete({ where: { id } });
  return true;
}

/** Переименовать проект — только владелец. true при успехе. */
export async function renameProject(id: string, title: string): Promise<boolean> {
  const userId = await currentUserId();
  if (!userId) return false;
  const clean = title.trim();
  if (!clean) return false;
  const board = await prisma.board.findUnique({ where: { id }, select: { ownerId: true } });
  if (!board || board.ownerId !== userId) return false;
  await prisma.board.update({ where: { id }, data: { title: clean.slice(0, 120) } });
  return true;
}
