import * as React from "react";
import { cn } from "./cn";

/**
 * Badge — статусы (ready/draft/generating), semantic (success/warning/error/info),
 * и «Beta» для упрощённого разбора файлов (EC-1). Mono-лейбл, токены DESIGN.md.
 */
type Variant = "default" | "outline" | "success" | "warning" | "error" | "info" | "beta";
type Size = "sm" | "md";

const base =
  "inline-flex items-center gap-1 font-mono uppercase tracking-[0.06em] rounded-sm select-none";

const variants: Record<Variant, string> = {
  default: "bg-surface-muted text-t2",
  outline: "bg-transparent text-t2 border border-border",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  error:   "bg-error text-error-foreground",
  info:    "bg-info text-info-foreground",
  beta:    "bg-gold-100 text-gold-700 border border-gold-300",
};

const sizes: Record<Size, string> = {
  sm: "text-[9px] px-1.5 py-0.5",
  md: "text-[10px] px-2 py-1",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
}

export function Badge({ className, variant = "default", size = "md", children, ...props }: BadgeProps) {
  return (
    <span className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}
