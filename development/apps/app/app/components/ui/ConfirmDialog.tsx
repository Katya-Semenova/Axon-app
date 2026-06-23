"use client";

import { createPortal } from "react-dom";
import { useEffect } from "react";
import { Button } from "./Button";

/**
 * ConfirmDialog — стилизованное окно подтверждения кита (замена window.confirm).
 * Контролируемое: показывается по `open`, две кнопки. Esc/клик по фону = отмена,
 * Enter = подтвердить. Стили — токены кита (никаких хексов, кроме полупрозрачного фона).
 */
export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, message, confirmLabel, cancelLabel, danger, onConfirm, onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      else if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onConfirm, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ background: "rgba(27,40,64,0.32)" }}
      onMouseDown={onCancel}
    >
      <div
        className="w-full max-w-[380px] bg-surface border border-border rounded-md p-5 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {title && <h2 className="font-sans text-[15px] font-semibold text-t1 mb-1.5">{title}</h2>}
        <p className="text-[13px] text-t2 leading-relaxed mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={danger ? "destructive" : "primary"} size="sm" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
