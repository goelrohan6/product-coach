import { cn } from "./utils";

export type TabsOption<T extends string> = {
  id: T;
  label: string;
};

export type TabsProps<T extends string> = {
  options: TabsOption<T>[];
  activeId: T;
  onSelect: (id: T) => void;
  className?: string;
};

export function Tabs<T extends string>({ options, activeId, onSelect, className }: TabsProps<T>) {
  return (
    <section
      className={cn(
        "inline-flex flex-wrap gap-2 rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:rgba(255,255,255,0.76)] p-2 shadow-[var(--shadow-xs)] backdrop-blur-sm",
        className
      )}
    >
      {options.map((option) => {
        const selected = option.id === activeId;
        return (
          <button
            type="button"
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={cn(
              "rounded-[var(--radius-full)] border px-4 py-2 text-[var(--text-base)] font-semibold transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
              selected
                ? "border-[color:var(--color-accent)] bg-[var(--color-accent)] text-white shadow-[var(--shadow-xs)]"
                : "border-[color:transparent] bg-transparent text-[var(--color-text-secondary)] hover:border-[color:var(--color-border-light)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </section>
  );
}
