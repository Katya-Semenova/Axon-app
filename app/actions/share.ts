"use server";

/**
 * Серверные действия для публичных ссылок на презентацию (Шаг 12).
 *
 * Создание/отзыв/чтение активной ссылки — ТОЛЬКО владелец доски (ownerId из
 * серверной сессии, IDOR-защита, как в app/actions/board.ts).
 * Чтение деки по токену — ПУБЛИЧНОЕ (без входа), и отдаём УРЕЗАННУЮ деку
 * (только слайды + их дата-сеты + тема) — без инсайтов/связей/позиций.
 */
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { BoardData, PublicDeck, Slide, DataSet } from "@/lib/types";

/** id вошедшего из серверной сессии (или null). */
async function currentUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

/** Вернуть boardId, только если доска принадлежит вошедшему; иначе null (IDOR). */
async function ownedBoardId(boardId: string): Promise<string | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  const board = await prisma.board.findUnique({ where: { id: boardId }, select: { ownerId: true } });
  return board && board.ownerId === userId ? boardId : null;
}

/**
 * Создать публичную ссылку на доску (или вернуть уже активную — не плодим токены).
 * Только владелец. Возвращает токен или null.
 */
export async function createShareLink(boardId: string): Promise<string | null> {
  if (!(await ownedBoardId(boardId))) return null;
  const existing = await prisma.shareLink.findFirst({
    where: { boardId, revoked: false },
    orderBy: { createdAt: "desc" },
    select: { token: true },
  });
  if (existing) return existing.token;
  const link = await prisma.shareLink.create({ data: { boardId }, select: { token: true } });
  return link.token;
}

/** Активный токен доски (чтобы показать «уже расшарено»). Только владелец. */
export async function getActiveShareToken(boardId: string): Promise<string | null> {
  if (!(await ownedBoardId(boardId))) return null;
  const link = await prisma.shareLink.findFirst({
    where: { boardId, revoked: false },
    orderBy: { createdAt: "desc" },
    select: { token: true },
  });
  return link?.token ?? null;
}

/** Отозвать все активные ссылки доски. Только владелец. true при успехе. */
export async function revokeShareLink(boardId: string): Promise<boolean> {
  if (!(await ownedBoardId(boardId))) return false;
  await prisma.shareLink.updateMany({ where: { boardId, revoked: false }, data: { revoked: true } });
  return true;
}

/**
 * Публичное чтение деки по токену (БЕЗ входа). Невалидный/отозванный/удалённый → null.
 * Возвращаем только слайды + дата-сеты, на которые они ссылаются, + тему.
 */
export async function getSharedBoard(token: string): Promise<PublicDeck | null> {
  const link = await prisma.shareLink.findUnique({
    where: { token },
    select: { revoked: true, boardId: true },
  });
  if (!link || link.revoked) return null;

  const board = await prisma.board.findUnique({
    where: { id: link.boardId },
    select: { data: true },
  });
  if (!board) return null;

  const snap = (board.data as unknown as BoardData)?.snapshot;
  if (!snap) return null;

  const slides = snap.slideOrder
    .map((id) => snap.slidesById[id])
    .filter((s): s is Slide => !!s);

  const dataSetsById: Record<string, DataSet> = {};
  for (const slide of slides) {
    for (const dsId of slide.dataSetIds) {
      const ds = snap.dataSetsById[dsId];
      if (ds) dataSetsById[dsId] = ds;
    }
  }

  return {
    slides,
    dataSetsById,
    presentationThemeId: (board.data as unknown as BoardData).presentationThemeId ?? "editorial",
  };
}
