import type { ButtonHTMLAttributes } from "react";
import { cn } from "./utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-accent)] text-white shadow-[var(--shadow-xs)] hover:brightness-95 active:translate-y-px active:brightness-95",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[color:var(--color-border)] shadow-[var(--shadow-xs)] hover:bg-[var(--color-surface-hover)]",
  ghost: "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
  danger: "bg-[var(--color-danger)] text-white shadow-[var(--shadow-xs)] hover:brightness-95 active:translate-y-px active:brightness-95"
};

const sizeClassName: Record<ButtonSize, string> = {
  sm: "h-8 rounded-[var(--radius-lg)] px-3 text-[var(--text-sm)]",
  md: "h-10 rounded-[var(--radius-lg)] px-4 text-[var(--text-base)]",
  lg: "h-11 rounded-[var(--radius-xl)] px-5 text-[var(--text-base)]"
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-[background-color,border-color,color,box-shadow,filter] duration-[var(--dur-fast)] ease-[var(--ease-standard)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantClassName[variant],
        sizeClassName[size],
        className
      )}
      {...props}
    />
  );
}
