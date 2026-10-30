import { Card } from "@/design-system/ui/GlassCard";

export function StatMini({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="flex items-center gap-4">
      <div className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </div>
      <div>
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </Card>
  );
}
