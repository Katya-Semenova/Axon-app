import * as React from "react";
import { cn } from "./cn";

/**
 * Card — поверхность контента (проекты, инсайты, секции). На токенах.
 * variant: default (surface) / raised (surface-raised) / interactive (hover-граница).
 */
type Variant = "default" | "raised" | "interactive";

const variants: Record<Variant, string> = {
  default:     "bg-surface border border-border",
  raised:      "bg-surface-raised border border-border",
  interactive: "bg-surface border border-border cursor-pointer transition-colors duration-200 hover:border-border-strong",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export function Card({ className, variant = "default", children, ...props }: CardProps) {
  return (
    <div className={cn("rounded-sm", variants[variant], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pt-4 pb-3", className)} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-3", className)} {...props} />;
}
export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pt-3 pb-4 border-t border-border", className)} {...props} />;
}
