import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SecondaryPanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function SecondaryPanel({ title, children, className }: SecondaryPanelProps) {
  return (
    <aside
      className={cn(
        "hidden xl:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-line px-5 py-6 overflow-y-auto scrollbar-thin",
        className,
      )}
    >
      {title && (
        <h2 className="text-sm font-semibold text-ink mb-4">{title}</h2>
      )}
      {children}
    </aside>
  );
}
