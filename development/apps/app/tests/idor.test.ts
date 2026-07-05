/**
 * Сценарий 3 (docs/test-cases.md): IDOR закрыт — чужие проекты недоступны.
 *
 * Интеграционный слой (не e2e): у доски нет своего URL (открывается через
 * состояние страницы), поэтому браузером чужую доску не запросить. Зовём
 * серверные функции напрямую — ровно те, что вызывает клиент, — на тестовой
 * БД axon_test (.env.test, как у e2e). Сессию подменяем моком: тест управляет,
 * «кто вошёл», и проверяет, что чужая доска везде выглядит как «не найдено».
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/* ── .env.test → process.env ДО импорта Prisma (клиент читает DATABASE_URL
      при создании). Файл обязателен, как в tests/e2e/server.sh. ── */
const envPath = path.resolve(__dirname, "../.env.test");
let envRaw: string;
try {
  envRaw = readFileSync(envPath, "utf8");
} catch {
  throw new Error("Нет apps/app/.env.test — создай: DATABASE_URL (база axon_test), BETTER_AUTH_SECRET, BETTER_AUTH_URL");
}
for (const line of envRaw.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
// Предохранитель: боевая база неприкосновенна (AGENTS.md, правило 4).
if (!/test/i.test(process.env.DATABASE_URL ?? "")) {
  throw new Error("DATABASE_URL из .env.test не похож на тестовую базу (нет «test» в строке) — стоп.");
}

/* ── Мок сессии: кем «вошли» решает тест. Better Auth и next/headers не нужны. ── */
let sessionUserId: string | null = null;
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: async () => (sessionUserId ? { user: { id: sessionUserId } } : null) } },
}));

/* Импортируем после мока/env — динамически, чтобы порядок был гарантирован. */
let prisma: (typeof import("@/lib/db"))["prisma"];
let board: typeof import("@/app/actions/board");
let share: typeof import("@/app/actions/share");

const RUN = Date.now();
const EMAIL_A = `idor-a-${RUN}@test.local`;
const EMAIL_B = `idor-b-${RUN}@test.local`;
let userA: string;
let userB: string;
let boardA: string;

/** Минимальная доска с одним слайдом — ровно то, что читает getSharedBoard. */
const BOARD_DATA = {
  snapshot: {
    insightsById: {}, dataSetsById: {}, insightOrder: [], dataSetOrder: [], connections: [],
    slidesById: { "s-1": { id: "s-1", serial: 1, dataSetIds: [], archetype: "Quote" } },
    slideOrder: ["s-1"],
  },
  nodePositions: {}, canvasTransform: { x: 0, y: 0, zoom: 0.75 }, presentationThemeId: "editorial",
};

beforeAll(async () => {
  prisma = (await import("@/lib/db")).prisma;
  board = await import("@/app/actions/board");
  share = await import("@/app/actions/share");
  const a = await prisma.user.create({ data: { email: EMAIL_A, name: "IDOR A" }, select: { id: true } });
  const b = await prisma.user.create({ data: { email: EMAIL_B, name: "IDOR B" }, select: { id: true } });
  userA = a.id;
  userB = b.id;
  const brd = await prisma.board.create({
    data: { title: `idor-${RUN}`, ownerId: userA, data: BOARD_DATA },
    select: { id: true },
  });
  boardA = brd.id;
});

afterAll(async () => {
  // Каскад в схеме удалит доски и ссылки вместе с пользователями.
  await prisma.user.deleteMany({ where: { email: { in: [EMAIL_A, EMAIL_B] } } });
  await prisma.$disconnect();
});

describe("IDOR: доска пользователя A недоступна B и гостю", () => {
  it("позитивный контроль: владелец A читает свою доску", async () => {
    sessionUserId = userA;
    const data = await board.getBoard(boardA);
    expect(data).not.toBeNull();
  });

  it("гость (без сессии): getBoard → null, saveBoard → false", async () => {
    sessionUserId = null;
    expect(await board.getBoard(boardA)).toBeNull();
    expect(await board.saveBoard(boardA, BOARD_DATA as never)).toBe(false);
  });

  it("B: чтение и запись чужой доски — «не найдено», данные не тронуты", async () => {
    sessionUserId = userB;
    expect(await board.getBoard(boardA)).toBeNull();
    expect(await board.saveBoard(boardA, { ...BOARD_DATA, presentationThemeId: "web" } as never)).toBe(false);
    expect(await board.renameProject(boardA, "захвачено")).toBe(false);
    expect(await board.deleteProject(boardA)).toBe(false);

    const raw = await prisma.board.findUnique({ where: { id: boardA }, select: { title: true, data: true } });
    expect(raw?.title).toBe(`idor-${RUN}`);
    expect((raw?.data as typeof BOARD_DATA).presentationThemeId).toBe("editorial");
  });

  it("B: шаринг чужой доски — создать/узнать/отозвать ссылку нельзя", async () => {
    sessionUserId = userB;
    expect(await share.createShareLink(boardA)).toBeNull();
    expect(await share.getActiveShareToken(boardA)).toBeNull();
    expect(await share.revokeShareLink(boardA)).toBe(false);
  });

  it("токен живёт при попытке чужого отзыва; отзыв владельца гасит деку", async () => {
    sessionUserId = userA;
    const token = await share.createShareLink(boardA);
    expect(token).toBeTruthy();

    // Публичное чтение по токену — без входа.
    sessionUserId = null;
    expect(await share.getSharedBoard(token!)).not.toBeNull();

    // B пытается отозвать — ссылка живёт.
    sessionUserId = userB;
    expect(await share.revokeShareLink(boardA)).toBe(false);
    sessionUserId = null;
    expect(await share.getSharedBoard(token!)).not.toBeNull();

    // Владелец отзывает — дека по токену «недоступна» (null).
    sessionUserId = userA;
    expect(await share.revokeShareLink(boardA)).toBe(true);
    sessionUserId = null;
    expect(await share.getSharedBoard(token!)).toBeNull();
  });

  it("B не видит проект A в своём списке проектов", async () => {
    sessionUserId = userB;
    const list = await board.listProjects();
    expect(list.find((p) => p.id === boardA)).toBeUndefined();
  });
});
