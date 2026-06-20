"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "./cn";

/**
 * Modal — диалог поверх контента (подтверждения, формы, детали).
 * Портал в body, backdrop (navy/40), Esc и клик по фону закрывают.
 * Слоты: title (шапка с крестиком), children (контент), footer (кнопки).
 */
type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  size?: Size;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export function Modal({ open, onClose, title, size = "md", footer, children }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-navy-900/40" />
      <div
        className={cn(
          "relative w-full bg-surface-raised border border-border rounded-sm shadow-[0_8px_24px_rgba(27,40,64,0.40)]",
          sizes[size]
        )}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
            <h2 className="font-serif text-[24px] leading-snug text-t1">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="text-t3 hover:text-t1 transition-colors duration-200 cursor-pointer shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-5 py-4 text-[13.5px] text-t2 leading-relaxed">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}
