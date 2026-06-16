"use client";

import { useEffect, useRef } from "react";
import { useWorkspaceStore } from "@/lib/store";
import { getBoard, saveBoard } from "@/app/actions/board";
import type { BoardData } from "@/lib/types";

/* Пока вход не сделан (Шаг 5), работаем с одной демо-доской.
   На Шаге 5/7 заменим на доску(и) вошедшего пользователя. */
const DEMO_BOARD_ID = "demo-board";

/** Собрать из стора то, что сохраняем в БД. */
function extractBoardData(): BoardData {
  const s = useWorkspaceStore.getState();
  return {
    snapshot: {
      insightsById: s.insightsById,
      dataSetsById: s.dataSetsById,
      slidesById:   s.slidesById,
      insightOrder: s.insightOrder,
      dataSetOrder: s.dataSetOrder,
      slideOrder:   s.slideOrder,
      connections:  s.connections,
    },
    nodePositions:       s.nodePositions,
    canvasTransform:     s.canvasTransform,
    presentationThemeId: s.presentationThemeId,
  };
}

/**
 * Синхронизация холста с базой (Урок 4, Шаг 4).
 * - при монтировании: грузим доску из БД и подставляем в стор
 *   (если доска пустая — оставляем демо-сид и сразу сохраняем его);
 * - при изменениях: авто-сохранение с задержкой ~1с (без дублей).
 * Невидимый служебный компонент (рендерит null).
 */
export function BoardSync() {
  const loadedRef    = useRef(false);
  const lastSavedRef = useRef<string>("");

  /* загрузка один раз */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getBoard(DEMO_BOARD_ID);
        if (cancelled) return;
        if (data && data.snapshot) {
          useWorkspaceStore.getState().hydrate(data);
          lastSavedRef.current = JSON.stringify(data);
        } else {
          /* пустая доска → берём текущий демо-сид и сохраняем как стартовое содержимое */
          const seed = extractBoardData();
          lastSavedRef.current = JSON.stringify(seed);
          await saveBoard(DEMO_BOARD_ID, seed);
        }
      } catch (err) {
        /* база недоступна — не падаем, просто работаем без сохранения */
        console.error("[BoardSync] не удалось загрузить доску:", err);
      } finally {
        loadedRef.current = true;
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* авто-сохранение при изменениях */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = useWorkspaceStore.subscribe(() => {
      if (!loadedRef.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const data = extractBoardData();
        const json = JSON.stringify(data);
        if (json === lastSavedRef.current) return;
        lastSavedRef.current = json;
        saveBoard(DEMO_BOARD_ID, data).catch((err) =>
          console.error("[BoardSync] не удалось сохранить доску:", err),
        );
      }, 1000);
    });
    return () => { if (timer) clearTimeout(timer); unsub(); };
  }, []);

  return null;
}
