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

  return (
    <>
      <div className="hidden lg:block fixed top-[74px] right-5 z-40">
        <Button size="sm" onClick={handleClick} loading={saving} leftIcon={
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h4l3 3z" />
            <path d="M5 2v3h3" />
          </svg>
        } className="shadow-[0_3px_10px_rgba(27,40,64,0.18)]">
          {t("button")}
        </Button>
      </div>
      <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} onAuthed={doSave} />
    </>
  );
}
