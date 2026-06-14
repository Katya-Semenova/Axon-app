"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "./cn";

/**
 * Toast — короткое уведомление (сохранено, экспортировано, ссылка скопирована,
 * ошибка). Variants на semantic-токенах. Используется через <ToastProvider> +
 * useToast(): `const { toast } = useToast(); toast("Сохранено", { variant: "success" })`.
 * Авто-скрытие ~3.5 с, есть крестик.
 */
type ToastVariant = "default" | "success" | "error" | "warning" | "info";

const variants: Record<ToastVariant, string> = {
  default: "bg-pill-bg text-pill-text",
  success: "bg-success text-success-foreground",
  error:   "bg-error text-error-foreground",
  warning: "bg-warning text-warning-foreground",
  info:    "bg-info text-info-foreground",
};

export function Toast({
  variant = "default", onClose, children,
}: {
  variant?: ToastVariant;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-sm px-4 py-2.5 text-[12.5px] font-sans " +
        "shadow-[0_6px_18px_rgba(27,40,64,0.35)] animate-fade-in",
      variants[variant]
    )}>
      <span className="leading-snug">{children}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Закрыть" className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer shrink-0">
          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

interface ToastItem { id: number; message: React.ReactNode; variant: ToastVariant; }

const ToastCtx = React.createContext<{
  toast: (message: React.ReactNode, opts?: { variant?: ToastVariant; duration?: number }) => void;
} | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

/** Оборачивает приложение (или секцию). Стек тостов снизу-справа, портал в body. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const idRef = React.useRef(0);

  const remove = React.useCallback((id: number) => setItems(s => s.filter(t => t.id !== id)), []);
  const toast = React.useCallback(
    (message: React.ReactNode, opts?: { variant?: ToastVariant; duration?: number }) => {
      const id = ++idRef.current;
      setItems(s => [...s, { id, message, variant: opts?.variant ?? "default" }]);
      const duration = opts?.duration ?? 3500;
      if (duration > 0) setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      {typeof document !== "undefined" && createPortal(
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end">
          {items.map(t => (
            <Toast key={t.id} variant={t.variant} onClose={() => remove(t.id)}>{t.message}</Toast>
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  );
}
