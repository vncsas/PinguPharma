import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/design-system/ui/Skeleton";
import { brl, dayShort } from "@/lib/utils";
import type { DashboardMetricsDTO } from "../api";

export function RevenueChart({
  series,
  isLoading,
}: {
  series: DashboardMetricsDTO["revenueLast7Days"] | undefined;
  isLoading: boolean;
}) {
  return (
    <div className="h-60">
      {isLoading || !series ? (
        <Skeleton className="h-full" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series.map((d) => ({ ...d, day: dayShort(d.date) }))}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2A4BF0" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#2A4BF0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E8EAF0" vertical={false} />
            <XAxis dataKey="day" stroke="#5B6478" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#5B6478"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => brl(v)}
              width={70}
            />
            <Tooltip
              contentStyle={{
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #E8EAF0",
                fontSize: 12,
              }}
              formatter={(v: number) => brl(v)}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#2A4BF0"
              strokeWidth={2}
              fill="url(#rev)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
