import * as React from "react";
import { cn } from "./cn";
import { Spinner } from "./Spinner";

/**
 * Button — единственный источник кнопок кита. Все варианты через `variant`,
 * размеры через `size`, состояния (hover/focus/disabled/loading) внутри.
 * Стили — только токены DESIGN.md (никаких хексов).
 */
type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 font-sans font-medium select-none " +
  "transition-colors duration-200 cursor-pointer " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:     "bg-pill-bg text-pill-text rounded-sm hover:opacity-85",
  secondary:   "bg-surface-muted text-t1 border border-border rounded-sm hover:border-border-strong",
  outline:     "bg-transparent text-t1 border border-border rounded-sm hover:border-border-strong",
  ghost:       "bg-transparent text-t2 rounded-sm hover:text-t1 hover:bg-surface-muted",
  destructive: "bg-error text-error-foreground rounded-sm hover:opacity-90",
  link:        "bg-transparent text-t2 rounded-none underline-offset-4 hover:text-t1 hover:underline",
};

const sizes: Record<Size, string> = {
  sm:   "h-8 px-3 text-[12px]",
  md:   "h-9 px-4 text-[13px]",
  lg:   "h-11 px-6 text-[14px]",
  icon: "h-9 w-9 p-0",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
);
Button.displayName = "Button";
