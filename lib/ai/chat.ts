/**
 * Живой AI-чат по данным (Урок 5, Шаг 1, фича «б») — ЧИСТЫЙ модуль (без секретов/сети;
 * сам вызов LLM — в app/api/ai/chat). Переиспользует провайдер-агностичный слой lib/ai
 * (ADR-008) и форму инсайта AIInsightPlan из движка.
 *
 * Чат — советник + «построить новый инсайт»: ИИ отвечает словами по сводке доски и при
 * уместности предлагает достроить новый инсайт-график из данных (action add-insight) →
 * пользователь применяет кнопкой. Приватность: наружу уходит только сводка доски + схема
 * колонок, не сырой файл.
 *
 *   buildChatBoardSummary(snapshot, sourceFiles) → текст-контекст доски   [клиент, до POST]
 *   buildChatMessages(req)                        → сообщения для LLMClient [сервер, в route]
 *   parseChatReply(text)                          → { answer, action }      [сервер, в route]
 */
import type { WorkspaceSnapshot, ChatAction } from "@/lib/types";
import { ACTIVE_CHART_TYPES } from "@/lib/types";
import type { LLMMessage } from "./types";

export type { ChatAction } from "@/lib/types";

/** Дата-сетов в сводку — берём СВЕЖИЕ (конец списка). 16 покрывает обычную доску;
    если больше — переживут новейшие, в т.ч. построенный чатом (баг Урок 5, B2). */
const MAX_SUMMARY_DATASETS = 16;
/** Строк дата-сета в сводку. Дата-сеты уже агрегированы (≈ строки графика), поэтому
    шлём их целиком до этого потолка — иначе рейтинги/суммы ИИ считал по обрезку
    (баг приёмки Урок 5: «лидер по штукам» определялся по первым 3 строкам). */
const SUMMARY_MAX_ROWS = 50;
const MAX_HISTORY = 12;

/** Реплика истории диалога (для многоходового контекста). */
export interface ChatTurn {
  role: "user" | "axon";
  content: string;
}

/** Колонка удержанной таблицы — чтобы ИИ предлагал валидный рецепт построения. */
export interface ChatColumnInfo {
  name: string;
  type: string;
}

export interface ChatRequest {
  question: string;
  history: ChatTurn[];
  /** Готовая сводка доски (то, что пользователь видит на холсте). */
  boardSummary: string;
  /** Схема колонок удержанной таблицы; [] — строить нечего (только Q&A). */
  columns: ChatColumnInfo[];
}

export interface ChatReply {
  answer: string;
  action: ChatAction | null;
}

/* ── Сводка доски (клиент) ──────────────────────────────────────────────── */

export function buildChatBoardSummary(snapshot: WorkspaceSnapshot, sourceFiles: string[]): string {
  const lines: string[] = [];
  lines.push(sourceFiles.length ? `Файлы: ${sourceFiles.join(", ")}.` : "Файлы не загружены.");

  // Берём с КОНЦА (свежие): построенный чатом инсайт дописывается в конец
  // dataSetOrder — раньше slice(0,8) его обрезал, и чат повторял «нет данных»
  // даже после Apply (баг приёмки Урок 5, B2).
  const dsTotal = snapshot.dataSetOrder.length;
  const ids = snapshot.dataSetOrder.slice(-MAX_SUMMARY_DATASETS);
  if (ids.length === 0) {
    lines.push("На холсте пока нет дата-сетов.");
    return lines.join("\n");
  }

  const shownNote = dsTotal > ids.length ? ` (показаны последние ${ids.length})` : "";
  lines.push(`Дата-сеты на холсте (${dsTotal})${shownNote}:`);
  for (const id of ids) {
    const ds = snapshot.dataSetsById[id];
    if (!ds) continue;
    const shown = ds.rows.slice(0, SUMMARY_MAX_ROWS);
    const rowsText = shown
      .map((r) => `${r.label}: ${r.values.join("/")}`)
      .join("; ");
    const more =
      ds.rows.length > SUMMARY_MAX_ROWS
        ? ` (показаны первые ${SUMMARY_MAX_ROWS} из ${ds.rows.length} строк)`
        : "";
    lines.push(`- «${ds.title}» (${ds.chartType}; колонки: ${ds.columns.join(", ")}) — ${rowsText}${more}`);
  }
  return lines.join("\n");
}

/* ── Промпт (сервер) ────────────────────────────────────────────────────── */

export function buildChatMessages(req: ChatRequest): LLMMessage[] {
  const canBuild = req.columns.length > 0;
  const colList = canBuild
    ? req.columns.map((c) => `"${c.name}" (${c.type})`).join(", ")
    : "(нет — строить новый инсайт нельзя)";

  const system = [
    "Ты — ассистент-аналитик Axon. Отвечаешь по данным пользователя кратко и по делу,",
    "на ЯЗЫКЕ ДАННЫХ/вопроса. Не выдумываешь числа — опираешься на сводку доски ниже.",
    "",
    "Сводка доски (что уже на холсте):",
    req.boardSummary,
    "",
    `Доступные сырые колонки для построения НОВОГО инсайта: ${colList}.`,
    "",
    "Иногда полезно предложить достроить НОВЫЙ инсайт-график из данных (срез, которого ещё нет).",
    canBuild
      ? "Если это уместно — верни action.type=\"add-insight\" с рецептом (числа посчитает код)."
      : "Сейчас строить новый инсайт нельзя (нет сырых колонок) — всегда action=null, только отвечай словами.",
    "Правки существующего (сменить тип графика, удалить, редактировать) НЕ предлагай — это пользователь делает сам.",
    "",
    "Рецепт инсайта (только при add-insight):",
    `- chartType: РОВНО один из: ${ACTIVE_CHART_TYPES.join(", ")}.`,
    "- dimension: имя ОДНОЙ колонки-измерения из доступных, либо null.",
    "- metrics: массив имён ЧИСЛОВЫХ колонок из доступных (одна; Scatter — две; Stacked Bar/Heatmap/Radar — несколько).",
    "- title и narrative — на языке данных.",
    "",
    "Ответь СТРОГО JSON-объектом без обрамления:",
    '{"answer":"текст ответа","action":null}',
    'либо {"answer":"...","action":{"type":"add-insight","plan":{"title":"","narrative":"","chartType":"","dimension":null,"metrics":[""]}}}',
  ].join("\n");

  const history: LLMMessage[] = req.history
    .slice(-MAX_HISTORY)
    .map((t) => ({ role: t.role === "axon" ? "assistant" : "user", content: t.content }));

  return [
    { role: "system", content: system },
    ...history,
    { role: "user", content: req.question },
  ];
}

/* ── Разбор ответа (сервер) ─────────────────────────────────────────────── */

/** Разбирает ответ ИИ в { answer, action }. Бросает Error, если нет внятного answer. */
export function parseChatReply(text: string): ChatReply {
  const json = extractJsonObject(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    // Не JSON — трактуем весь текст как ответ словами (без действия).
    const fallback = text.trim();
    if (!fallback) throw new Error("Пустой ответ ИИ");
    return { answer: fallback, action: null };
  }

  const o = parsed as Record<string, unknown>;
  const answer = typeof o.answer === "string" ? o.answer.trim() : "";
  if (!answer) throw new Error("Ответ ИИ без поля answer");

  const action = parseAction(o.action);
  return { answer, action };
}

function parseAction(raw: unknown): ChatAction | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  if (a.type !== "add-insight" || !a.plan || typeof a.plan !== "object") return null;

  const p = a.plan as Record<string, unknown>;
  const title = typeof p.title === "string" ? p.title.trim() : "";
  const narrative = typeof p.narrative === "string" ? p.narrative.trim() : "";
  const chartType = typeof p.chartType === "string" ? p.chartType.trim() : "";
  const dimension =
    typeof p.dimension === "string" && p.dimension.trim() ? p.dimension.trim() : null;
  const metrics = Array.isArray(p.metrics)
    ? p.metrics.filter((m): m is string => typeof m === "string" && m.trim().length > 0).map((m) => m.trim())
    : [];

  if (!title || metrics.length === 0) return null; // неполный рецепт — игнорируем действие
  return { type: "add-insight", plan: { title, narrative, chartType, dimension, metrics } };
}

/** Вырезает первый JSON-объект из текста (на случай обёрток/прозы). */
function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return text;
  return text.slice(start, end + 1);
}
