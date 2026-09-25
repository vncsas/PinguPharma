import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const badge = cva(
  "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-surface-alt text-ink-muted",
        brand: "bg-brand-50 text-brand-600",
        warn: "bg-accent-amber/15 text-[#7A5200]",
        danger: "bg-accent-rose/10 text-accent-rose",
        success: "bg-accent-success/10 text-accent-success",
        orange: "bg-accent-orange/10 text-accent-orange",
        solid: "bg-ink text-white",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {
  dot?: boolean;
}

export function Badge({ tone = "neutral", dot, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cn(badge({ tone }), className)} {...rest}>
      {dot && (
        <span
          className={cn(
            "size-1.5 rounded-full",
            tone === "brand" && "bg-brand-500",
            tone === "warn" && "bg-accent-amber",
            tone === "danger" && "bg-accent-rose",
            tone === "success" && "bg-accent-success",
            tone === "orange" && "bg-accent-orange",
            tone === "neutral" && "bg-ink-subtle",
            tone === "solid" && "bg-white",
          )}
        />
      )}
      {children}
    </span>
  );
}
