import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";

export function TableShell({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("card overflow-hidden !p-0", className)}
      {...rest}
    >
      <div className="overflow-x-auto scrollbar-thin">{children}</div>
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return <table className="w-full text-sm text-left">{children}</table>;
}

export function Th(props: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={cn(
        "px-5 py-3 text-xs font-medium text-ink-muted border-b border-line bg-surface-alt/60",
        props.className,
      )}
    />
  );
}

export function Td(props: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      className={cn("px-5 py-3.5 border-b border-line text-ink last:border-b-0", props.className)}
    />
  );
}

export function Tr(props: HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props} className={cn("hover:bg-surface-alt/50 transition-colors", props.className)} />;
}
