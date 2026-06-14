import * as React from "react";
import { cn } from "./cn";

/**
 * Label — mono-лейбл формы. required → золотая звёздочка (акцент).
 */
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "block font-mono text-[10.5px] uppercase tracking-[0.09em] text-t3 mb-2",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-second"> *</span>}
    </label>
  );
}
