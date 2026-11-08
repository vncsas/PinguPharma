import { Card } from "./GlassCard";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  icon?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  icon,
  footer,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-ink-muted">{label}</span>
        {icon && (
          <span className="flex size-8 items-center justify-center rounded-lg bg-surface-alt text-ink-muted">
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-ink">{value}</span>
        {delta && (
          <span
            className={cn(
              "text-xs font-medium",
              deltaTone === "up" && "text-accent-success",
              deltaTone === "down" && "text-accent-rose",
              deltaTone === "neutral" && "text-ink-muted",
            )}
          >
            {delta}
          </span>
        )}
      </div>
      {footer && <div className="text-xs text-ink-subtle">{footer}</div>}
    </Card>
  );
}
