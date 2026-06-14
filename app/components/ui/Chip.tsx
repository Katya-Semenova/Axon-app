import * as React from "react";
import { cn } from "./cn";

/**
 * Chip — строчный тег/метка с опциональной иконкой (имена файлов, источники).
 * Отличается от Badge: Chip — НЕ uppercase, нейтральный (surface-muted), для
 * пользовательских строк (filename); Badge — uppercase статусы/semantic.
 */
export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon?: React.ReactNode;
}

export function Chip({ className, icon, children, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] bg-surface-muted text-t2 font-mono text-[10.5px] rounded-sm px-[10px] py-1 select-none",
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
