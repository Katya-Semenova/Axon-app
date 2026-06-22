import type { ParsedTable } from "@/lib/file-parsing";
import type { BoardData } from "@/lib/types";
import { buildBoardData } from "./index";
import { buildExtractionInput, executePlan, type AIPlan } from "./ai-plan";
import { BASE_PATH } from "@/lib/base-path";

/**
 * Построить доску из таблицы (Урок 5, Шаг 1) — единая точка «ИИ или правила».
 *
 * useAI=true (только вошедшим): пробуем реальный ИИ через /api/ai/extract
 * (туда уходит лишь схема+выборка), затем считаем доску на реальных числах
 * локально (executePlan). ЛЮБОЙ сбой — нет ключа (503), гость (401), лимит (429),
 * апстрим (502), пустой план — тихо падаем на разбор по правилам (buildBoardData).
 * useAI=false (гость): сразу правила, данные браузер не покидают.
 *
 * Клиентский модуль: ходит в свой route fetch'ем, lib/ai (server-only) не импортирует.
 * `engine` — каким движком построено (для будущего UI-нотиса «базовый разбор»).
 */
export async function extractBoardData(
  table: ParsedTable,
  opts: { useAI: boolean },
): Promise<{ board: BoardData; engine: "ai" | "rules" }> {
  if (opts.useAI) {
    try {
      const res = await fetch(`${BASE_PATH}/api/ai/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildExtractionInput(table)),
      });
      if (res.ok) {
        const { plan } = (await res.json()) as { plan: AIPlan };
        return { board: executePlan(table, plan), engine: "ai" };
      }
      // не-200 (401/429/503/502) — уходим в fallback ниже.
    } catch (err) {
      console.warn("[extract] ИИ недоступен, fallback на правила:", err);
    }
  }
  return { board: buildBoardData(table), engine: "rules" };
}
