import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  error?: string | null;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, leadingIcon, trailingIcon, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg bg-white h-10 px-3 border transition-colors",
            "border-line-strong",
            "focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/15",
            error && "border-accent-rose focus-within:ring-accent-rose/15",
            className,
          )}
        >
          {leadingIcon && <span className="text-ink-muted">{leadingIcon}</span>}
          <input
            ref={ref}
            className="w-full bg-transparent outline-none text-sm text-ink placeholder:text-ink-subtle"
            {...props}
          />
          {trailingIcon && <span className="text-ink-muted">{trailingIcon}</span>}
        </div>
        {error && <p className="text-xs text-accent-rose pl-1">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-medium text-ink-muted">
      {children}
    </label>
  );
}

export function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}
