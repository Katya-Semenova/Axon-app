import * as React from "react";
import { cn } from "./cn";

/**
 * Textarea — многострочное поле (чат-инпут, narrative слайда). На токенах.
 * states: default / focus (золотой ring) / invalid / disabled.
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 3, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full bg-surface-muted text-t1 placeholder:text-t3 rounded-sm border outline-none " +
          "px-3 py-2 text-[13.5px] leading-relaxed resize-none " +
          "transition-colors duration-200 focus-visible:border-gold-500 " +
          "disabled:opacity-50 disabled:cursor-not-allowed",
        invalid ? "border-error" : "border-border",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
