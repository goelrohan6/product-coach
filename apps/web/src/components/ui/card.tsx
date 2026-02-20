import type { HTMLAttributes } from "react";
import { cn } from "./utils";

type CardVariant = "default" | "subtle" | "elevated";
type CardPadding = "none" | "sm" | "md" | "lg";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  padding?: CardPadding;
};

const variantClassName: Record<CardVariant, string> = {
  default:
    "bg-[var(--color-surface)] border border-[color:var(--color-border)] shadow-[var(--shadow-xs)] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] before:content-['']",
  subtle:
    "bg-[var(--color-surface-hover)] border border-[color:var(--color-border-light)] shadow-[var(--shadow-xs)] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] before:content-['']",
  elevated:
    "bg-[var(--color-surface)] border border-[color:var(--color-border)] shadow-[var(--shadow-sm)] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] before:content-['']"
};

const paddingClassName: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4 md:p-5",
  lg: "p-5 md:p-6"
};

export function Card({
  className,
  variant = "default",
  padding = "md",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "relative rounded-[var(--radius-2xl)] text-[var(--color-text-primary)] transition-colors duration-[var(--dur-normal)] ease-[var(--ease-standard)]",
        variantClassName[variant],
        paddingClassName[padding],
        className
      )}
      {...props}
    />
  );
}
