import { cn } from "./cn";

/**
 * Avatar — инициалы-фолбэк (статичный «KS» в текущем коде). На токенах.
 */
type Size = "xs" | "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  xs: "w-6 h-6 text-[9px]",
  sm: "w-8 h-8 text-[11px]",
  md: "w-10 h-10 text-[12px]",
  lg: "w-12 h-12 text-[14px]",
};

export function Avatar({
  initials,
  src,
  size = "sm",
  className,
}: {
  initials: string;
  src?: string | null;
  size?: Size;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={initials}
        className={cn("inline-block rounded-pill object-cover border border-border select-none", sizes[size], className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-pill bg-card border border-border " +
          "text-t2 font-mono font-medium select-none",
        sizes[size],
        className
      )}
    >
      {initials}
    </span>
  );
}
