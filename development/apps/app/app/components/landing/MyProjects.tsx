"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "../ui/Card";
import { listProjects, createProject, deleteProject, renameProject } from "@/app/actions/board";
import type { ProjectSummary } from "@/lib/types";

/**
 * «Мои проекты» (Урок 4, Шаг 7) — реальный список досок вошедшего пользователя.
 * Загружает проекты с сервера, позволяет создать / открыть / переименовать /
 * удалить. Открытие пробрасывает board id наверх (в воркспейс).
 *
 * Подтверждение удаления / ввод имени — пока через системные диалоги браузера;
 * замена на стилизованные модалки — отдельная задача полировки (вне Шага 7).
 */
export function MyProjects({ onOpen }: { onOpen: (boardId: string) => void }) {
  const t = useTranslations("Landing");
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      setProjects(await listProjects());
    } catch (err) {
      console.error("[MyProjects] не удалось загрузить список:", err);
      setProjects([]);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  async function handleCreate() {
    if (busy) return;
    setBusy(true);
    try {
      const id = await createProject();
      if (id) onOpen(id);
    } catch (err) {
      console.error("[MyProjects] не удалось создать проект:", err);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(p: ProjectSummary) {
    const title = p.title || t("my.untitled");
    if (!window.confirm(t("my.deleteConfirm", { title }))) return;
    try {
      await deleteProject(p.id);
      await reload();
    } catch (err) {
      console.error("[MyProjects] не удалось удалить проект:", err);
    }
  }

  async function handleRename(p: ProjectSummary) {
    const next = window.prompt(t("my.renamePrompt"), p.title);
    if (next == null) return;
    const clean = next.trim();
    if (!clean || clean === p.title) return;
    try {
      await renameProject(p.id, clean);
      await reload();
    } catch (err) {
      console.error("[MyProjects] не удалось переименовать проект:", err);
    }
  }

  return (
    <div className="px-12 pb-[96px] max-md:px-6 max-md:pb-[72px] max-sm:px-4 max-sm:pb-[60px]">
      <div className="flex items-center justify-between mb-7">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-t3">{t("my.title")}</span>
        <button
          onClick={handleCreate}
          disabled={busy}
          className="font-mono text-[11.5px] text-t2 hover:text-t1 transition-colors duration-200 disabled:opacity-50 cursor-pointer"
        >
          + {t("my.new")}
        </button>
      </div>

      {projects === null ? (
        <p className="font-mono text-[11.5px] text-t3">{t("my.loading")}</p>
      ) : projects.length === 0 ? (
        <Card variant="interactive" onClick={handleCreate} className="p-10 text-center">
          <p className="text-[15px] font-medium text-t1 mb-1.5">{t("my.empty")}</p>
          <p className="font-mono text-[11.5px] text-t2">+ {t("my.emptyCta")}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
          {projects.map((p) => (
            <Card key={p.id} variant="interactive" onClick={() => onOpen(p.id)} className="p-7 flex flex-col justify-between min-h-[140px]">
              <div className="text-[15px] font-medium text-t1 leading-[1.4] mb-5">
                {p.title || t("my.untitled")}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] text-t3">
                  {t("my.updated", { date: new Date(p.updatedAt).toLocaleDateString() })}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRename(p); }}
                    className="font-mono text-[10.5px] text-t3 hover:text-t1 transition-colors duration-200 cursor-pointer"
                  >
                    {t("my.rename")}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
                    className="font-mono text-[10.5px] text-t3 hover:text-error transition-colors duration-200 cursor-pointer"
                  >
                    {t("my.delete")}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
