import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function QuickAction({
  icon,
  title,
  subtitle,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-alt transition-colors"
    >
      <span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-ink leading-tight">{title}</p>
        <p className="text-xs text-ink-muted">{subtitle}</p>
      </div>
      <ArrowRight className="size-4 text-ink-muted" />
    </Link>
  );
}
