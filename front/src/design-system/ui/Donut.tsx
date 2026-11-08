import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface DonutProps {
  value: number;
  total: number;
  colorA?: string;
  colorB?: string;
  size?: number;
}

export function Donut({
  value,
  total,
  colorA = "#2A4BF0",
  colorB = "#F58220",
  size = 140,
}: DonutProps) {
  const safeTotal = Math.max(1, total);
  const data = [
    { name: "a", value: Math.min(value, safeTotal) },
    { name: "b", value: Math.max(0, safeTotal - value) },
  ];
  return (
    <div style={{ width: size, height: size }} className="relative">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            innerRadius={size * 0.36}
            outerRadius={size * 0.48}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={colorA} />
            <Cell fill={colorB} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-3xl font-semibold text-ink leading-none">{value}</div>
          <div className="text-xs text-ink-muted">de {total}</div>
        </div>
      </div>
    </div>
  );
}

export function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-ink-muted">
      <span className="size-2 rounded-sm" style={{ background: color }} />
      {label}
    </div>
  );
}
