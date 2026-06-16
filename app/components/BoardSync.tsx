"use client";

import { useEffect, useRef } from "react";
import { useWorkspaceStore } from "@/lib/store";
import { getBoard, saveBoard } from "@/app/actions/board";
import { authClient } from "@/lib/auth-client";
import type { BoardData } from "@/lib/types";

/* Пока вход не разведён по пользователям (Шаг 7), работаем с одной демо-доской. */
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
 * Синхронизация холста с базой (Урок 4).
 * - Шаг 4: загрузка доски при открытии, авто-сохранение изменений (~1с).
 * - Шаг 5: сохраняем ТОЛЬКО когда есть вход — гость работает с холстом, но в
 *   базу не пишет. (Per-user доски — Шаг 7; пока вошедшие пишут в общую демо-доску.)
 * Невидимый служебный компонент (рендерит null).
 */
export function BoardSync() {
  const loadedRef    = useRef(false);
  const lastSavedRef = useRef<string>("");

  const { data: session } = authClient.useSession();
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);

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
          /* пустая доска: оставляем демо из стора; сид сохраняем только если вошли */
          const seed = extractBoardData();
          lastSavedRef.current = JSON.stringify(seed);
          if (sessionRef.current) await saveBoard(DEMO_BOARD_ID, seed);
        }
      } catch (err) {
        console.error("[BoardSync] не удалось загрузить доску:", err);
      } finally {
        loadedRef.current = true;
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* авто-сохранение при изменениях — только для вошедших */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = useWorkspaceStore.subscribe(() => {
      if (!loadedRef.current) return;
      if (!sessionRef.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!sessionRef.current) return;
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
