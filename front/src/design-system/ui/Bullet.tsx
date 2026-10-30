import type { ReactNode } from "react";

export function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 size-1.5 rounded-full bg-brand-500 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
