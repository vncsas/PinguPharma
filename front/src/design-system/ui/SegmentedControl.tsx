import { cn } from "@/lib/utils";

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  className?: string;
}

/** Grupo de botões exclusivos (papel, status...). `type="button"` evita submeter o form pai. */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn("grid gap-2", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-10 rounded-lg text-sm font-medium border ${
            value === o.value
              ? "bg-brand-500 text-white border-brand-500"
              : "bg-white text-ink border-line-strong hover:bg-surface-alt"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
