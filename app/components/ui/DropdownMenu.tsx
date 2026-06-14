"use client";

import * as React from "react";
import { cn } from "./cn";

/**
 * DropdownMenu — меню по триггеру (меню под аватаром, выбор формата экспорта).
 * Клик вне и Esc закрывают. items — массив пунктов; separatorBefore — разделитель,
 * destructive — красный пункт (напр. «Выход»/«Удалить»).
 */
export interface DropdownItem {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
  separatorBefore?: boolean;
}

export function DropdownMenu({
  trigger, items, align = "end",
}: {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "start" | "end";
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute mt-1 min-w-[160px] bg-surface-raised border border-border rounded-sm " +
              "shadow-[0_8px_24px_rgba(27,40,64,0.20)] py-1 z-40 animate-fade-in",
            align === "end" ? "right-0" : "left-0"
          )}
        >
          {items.map((it, i) => (
            <React.Fragment key={i}>
              {it.separatorBefore && <div className="my-1 border-t border-border" />}
              <button
                role="menuitem"
                type="button"
                onClick={() => { it.onClick?.(); setOpen(false); }}
                className={cn(
                  "flex items-center gap-2 w-full text-left px-3 py-2 text-[12.5px] font-sans " +
                    "cursor-pointer transition-colors duration-150 hover:bg-surface-muted",
                  it.destructive ? "text-error" : "text-t2 hover:text-t1"
                )}
              >
                {it.icon}
                {it.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
