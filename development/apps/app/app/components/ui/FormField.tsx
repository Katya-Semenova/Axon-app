import * as React from "react";
import { cn } from "./cn";
import { Label } from "./Label";

/**
 * FormField — молекула: Label + контрол (Input/Textarea/Select) + ошибка/подсказка.
 * Передаёшь `error` — показываем красный текст под полем; `hint` — серая подсказка.
 * Контрол сам переключает invalid (пробрось проп в Input/Textarea при error).
 */
export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, htmlFor, required, error, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-[11.5px] text-error">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[11.5px] text-t3">{hint}</p>
      ) : null}
    </div>
  );
}
