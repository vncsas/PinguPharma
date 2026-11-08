export function AlertItem({
  icon,
  title,
  description,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone: "rose" | "amber" | "brand";
}) {
  const bg =
    tone === "rose"
      ? "bg-accent-rose/10 text-accent-rose border-accent-rose/20"
      : tone === "amber"
        ? "bg-accent-amber/15 text-[#7A5200] border-accent-amber/25"
        : "bg-brand-500/10 text-brand-700 border-brand-500/20";
  return (
    <li className="flex items-start gap-3 rounded-lg border border-line bg-white p-3">
      <span className={`grid size-10 place-items-center rounded-lg border ${bg}`}>{icon}</span>
      <div>
        <p className="font-medium text-ink text-sm leading-tight">{title}</p>
        <p className="text-xs text-ink-muted">{description}</p>
      </div>
    </li>
  );
}
