"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { currentBoardData } from "@/lib/store";
import { createProjectFromData } from "@/app/actions/board";
import { useToast } from "@/app/components/ui/Toast";
import { Button } from "@/app/components/ui/Button";
import { AuthModal } from "@/app/components/AuthModal";

/**
 * Кнопка «Сохранить» для гостя (Урок 4, Шаг 7b).
 * Показывается только когда холст НЕ привязан к доске (boardId === null = гость).
 * По клику: если уже вошёл — сохраняем сразу; иначе открываем окно входа.
 * После входа текущий гостевой холст переносится в новый проект аккаунта,
 * onSaved(id) привязывает воркспейс к этой доске (дальше работает автосейв).
 */
export function GuestSaveButton({
  boardId, onSaved,
}: { boardId: string | null; onSaved: (id: string) => void }) {
  const { data: session } = authClient.useSession();
  const { toast } = useToast();
  const t = useTranslations("SaveFlow");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Холст уже привязан к доске — сохранять отдельно не нужно (работает автосейв). */
  if (boardId !== null) return null;

  async function doSave() {
    setSaving(true);
    try {
      const id = await createProjectFromData(currentBoardData());
      if (id) {
        setModalOpen(false);
        onSaved(id);
        toast(t("toastSaved"), { variant: "success" });
      } else {
        toast(t("toastError"), { variant: "error" });
      }
    } catch {
      toast(t("toastError"), { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  function handleClick() {
    if (session) doSave();
    else setModalOpen(true);
  }

  /* Inline toolbar button (Слайды rework — перенесено из плавающего fixed-оверлея
     в тулбар каждого режима, чтобы не накрывать правый рельс). Desktop-only. */
  return (
    <>
      {/* Geometry matched 1:1 to the toolbar «How it works» button (h-28, mono
         10.5, square); stays filled (primary) as the main action. */}
      <Button
        size="sm"
        onClick={handleClick}
        loading={saving}
        title={session ? undefined : t("saveHint")}
        className="hidden lg:inline-flex h-[28px] px-3 gap-1.5"
        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "0.04em", borderRadius: 0 }}
        leftIcon={
          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h4l3 3z" />
            <path d="M5 2v3h3" />
          </svg>
        }
      >
        {t("button")}
      </Button>
      <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} onAuthed={doSave} />
    </>
  );
}
