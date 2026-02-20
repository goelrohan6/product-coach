import type { HTMLAttributes } from "react";
import { cn } from "./utils";

type ProgressTone = "accent" | "warning";

export type ProgressBarProps = HTMLAttributes<HTMLDivElement> & {
  value: number;
  tone?: ProgressTone;
};

const toneClassName: Record<ProgressTone, string> = {
  accent: "bg-[var(--color-accent)]",
  warning: "bg-[var(--color-accent-alt)]"
};

export function ProgressBar({ value, tone = "accent", className, ...props }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn("h-1.5 rounded-[var(--radius-full)] bg-[var(--color-surface-hover)] overflow-hidden", className)}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-[var(--radius-full)] transition-[width] duration-[var(--dur-normal)] ease-[var(--ease-standard)]",
          toneClassName[tone]
        )}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
