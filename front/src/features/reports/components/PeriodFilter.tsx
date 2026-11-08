import { Card } from "@/design-system/ui/GlassCard";
import { Button } from "@/design-system/ui/Button";
import { Input } from "@/design-system/ui/Input";
import { isoDate } from "../utils";

export function PeriodFilter({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  return (
    <Card className="flex flex-col md:flex-row md:items-end gap-3">
      <div className="grid grid-cols-2 gap-3 max-w-md flex-1">
        <div>
          <label className="text-xs font-medium text-ink-muted">De</label>
          <Input type="date" value={from} onChange={(e) => onChange(e.target.value, to)} />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted">Até</label>
          <Input type="date" value={to} onChange={(e) => onChange(from, e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        {[
          { label: "7d", d: 6 },
          { label: "30d", d: 29 },
          { label: "90d", d: 89 },
        ].map((p) => (
          <Button
            key={p.label}
            variant="outline"
            size="sm"
            onClick={() => onChange(isoDate(-p.d), isoDate(0))}
          >
            {p.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
