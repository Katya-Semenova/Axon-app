import * as React from "react";
import { cn } from "./cn";

/**
 * BackButton — голая текст-ссылка «назад» с шевроном (mono, без фона/паддинга).
 * DRY-ит повторяющийся паттерн возврата (Back / Back to Grid / Back to Canvas).
 * Текст — через children (по умолчанию «Back»). На токенах: text-t2 → hover text-t1.
 */
export interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function BackButton({ className, children = "Back", ...props }: BackButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-[5px] font-mono text-[11.5px] text-t2 hover:text-t1 " +
          "transition-colors duration-200 cursor-pointer shrink-0",
        className
      )}
      {...props}
    >
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="shrink-0">
        <path d="M9 2L4 7l5 5" />
      </svg>
      <span className="leading-none relative top-[1px]">{children}</span>
    </button>
  );
}
