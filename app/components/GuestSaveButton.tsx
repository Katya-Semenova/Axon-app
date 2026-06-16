"use client";

import { useState } from "react";
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
        toast("Проект сохранён", { variant: "success" });
      } else {
        toast("Не удалось сохранить — попробуйте ещё раз", { variant: "error" });
      }
    } catch {
      toast("Не удалось сохранить — попробуйте ещё раз", { variant: "error" });
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
      <div className="hidden lg:block fixed top-[76px] right-5 z-40">
        <Button onClick={handleClick} loading={saving} className="shadow-[0_4px_14px_rgba(27,40,64,0.25)]">
          Сохранить
        </Button>
      </div>
      <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} onAuthed={doSave} />
    </>
  );
}
