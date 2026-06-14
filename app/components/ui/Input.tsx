import * as React from "react";
import { cn } from "./cn";

/**
 * Input — текстовое поле формы (login/signup/settings, поиск проектов).
 * states: default / focus (золотой ring — глобально) / invalid / disabled.
 * `inputSize` вместо `size`, чтобы не конфликтовать с нативным атрибутом size.
 */
type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "h-8 px-2.5 text-[12px]",
  md: "h-9 px-3 text-[13px]",
  lg: "h-11 px-3.5 text-[14px]",
};

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  inputSize?: Size;
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, inputSize = "md", invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full bg-surface-muted text-t1 placeholder:text-t3 rounded-sm border outline-none " +
          "transition-colors duration-200 focus-visible:border-gold-500 " +
          "disabled:opacity-50 disabled:cursor-not-allowed",
        invalid ? "border-error" : "border-border",
        sizes[inputSize],
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
