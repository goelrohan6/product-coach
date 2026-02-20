import type { HTMLAttributes } from "react";
import { cn } from "./utils";

type PillVariant = "neutral" | "accent" | "warning";

export type PillProps = HTMLAttributes<HTMLDivElement> & {
  variant?: PillVariant;
};

const variantClassName: Record<PillVariant, string> = {
  neutral:
    "border border-[color:var(--color-border-light)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]",
  accent:
    "border border-[color:var(--color-accent-soft-border)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
  warning:
    "border border-[color:var(--color-accent-alt-soft-border)] bg-[var(--color-accent-alt-soft)] text-[var(--color-accent-alt)]"
};

export function Pill({ className, variant = "neutral", ...props }: PillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[var(--radius-full)] px-3.5 py-1.5 text-[var(--text-sm)] font-semibold tracking-[-0.01em]",
        variantClassName[variant],
        className
      )}
      {...props}
    />
  );
}
