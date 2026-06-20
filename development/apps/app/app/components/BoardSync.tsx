"use client";

import { useEffect, useRef } from "react";
import { useWorkspaceStore, initialBoardData, currentBoardData } from "@/lib/store";
import { getBoard, saveBoard } from "@/app/actions/board";

/**
 * Синхронизация холста с базой (Урок 4).
 * - Шаг 4: загрузка доски при открытии, авто-сохранение изменений (~1с).
 * - Шаг 7: работаем с КОНКРЕТНОЙ доской пользователя (`boardId`), а не с общей
 *   демо-доской. `boardId === null` — гость: холст живёт в памяти, в базу не пишем.
 *   Свежесозданный (пустой) проект наполняется демо-сидом и сохраняется.
 * Невидимый служебный компонент (рендерит null).
 */
export function BoardSync({ boardId }: { boardId: string | null }) {
  const loadedRef    = useRef(false);
  const lastSavedRef = useRef<string>("");

  /* загрузка при открытии доски (и при смене boardId) */
  useEffect(() => {
    loadedRef.current = false;
    if (!boardId) return; /* гость — ничего не грузим и не сохраняем */

    let cancelled = false;
    (async () => {
      try {
        const data = await getBoard(boardId);
        if (cancelled) return;
        if (data && data.snapshot) {
          useWorkspaceStore.getState().hydrate(data);
          lastSavedRef.current = JSON.stringify(data);
        } else {
          /* пустой (только что созданный) проект → засеять свежим демо и сохранить.
             Берём начальную доску из стора-фабрики, а не текущее состояние —
             иначе новый проект унаследовал бы контент ранее открытой доски. */
          const seed = initialBoardData();
          useWorkspaceStore.getState().hydrate(seed);
          lastSavedRef.current = JSON.stringify(seed);
          await saveBoard(boardId, seed);
        }
      } catch (err) {
        console.error("[BoardSync] не удалось загрузить доску:", err);
      } finally {
        if (!cancelled) loadedRef.current = true;
      }
    })();
    return () => { cancelled = true; };
  }, [boardId]);

  /* авто-сохранение при изменениях — только когда открыта доска (есть boardId) */
  useEffect(() => {
    if (!boardId) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = useWorkspaceStore.subscribe(() => {
      if (!loadedRef.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const data = currentBoardData();
        const json = JSON.stringify(data);
        if (json === lastSavedRef.current) return;
        lastSavedRef.current = json;
        saveBoard(boardId, data).catch((err) =>
          console.error("[BoardSync] не удалось сохранить доску:", err),
        );
      }, 1000);
    });
    return () => { if (timer) clearTimeout(timer); unsub(); };
  }, [boardId]);

  return null;
}
