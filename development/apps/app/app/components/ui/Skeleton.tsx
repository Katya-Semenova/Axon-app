import { cn } from "./cn";

/**
 * Skeleton — плейсхолдер загрузки. Использует системный класс `.shimmer`
 * (тёплый градиент из globals.css). variant: text / circular / rectangular.
 */
type Variant = "text" | "circular" | "rectangular";

const variants: Record<Variant, string> = {
  text:        "h-3.5 rounded-sm",
  circular:    "rounded-pill",
  rectangular: "rounded-sm",
};

export function Skeleton({
  variant = "rectangular",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  return <div className={cn("shimmer", variants[variant], className)} />;
}
