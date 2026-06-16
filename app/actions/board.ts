"use server";

/**
 * Серверные функции для досок (Урок 4, Шаг 4).
 * Выполняются на сервере, ходят в базу через Prisma. Клиент вызывает их напрямую.
 */
import { prisma } from "@/lib/db";
import type { BoardData } from "@/lib/types";
import type { Prisma } from "@prisma/client";

/** Прочитать содержимое доски из БД (или null, если доски нет). */
export async function getBoard(id: string): Promise<BoardData | null> {
  const board = await prisma.board.findUnique({ where: { id } });
  if (!board) return null;
  return board.data as unknown as BoardData;
}

/** Сохранить содержимое доски в БД. */
export async function saveBoard(id: string, data: BoardData): Promise<void> {
  await prisma.board.update({
    where: { id },
    data: { data: data as unknown as Prisma.InputJsonValue },
  });
}
