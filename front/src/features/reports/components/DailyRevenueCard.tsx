import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/design-system/ui/GlassCard";
import { Skeleton } from "@/design-system/ui/Skeleton";
import { brl, dayShort } from "@/lib/utils";
import type { FinancialReportDTO } from "../api";

export function DailyRevenueCard({
  report,
  isLoading,
}: {
  report: FinancialReportDTO | undefined;
  isLoading: boolean;
}) {
  const dailyChart = useMemo(
    () => report?.daily.map((d) => ({ ...d, day: dayShort(d.date) })) ?? [],
    [report],
  );

  return (
    <Card className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-ink">Faturamento diário</h3>
        <p className="text-xs text-ink-muted">Período selecionado</p>
      </div>
      <div className="h-64">
        {isLoading || !report ? (
          <Skeleton className="h-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyChart}>
              <CartesianGrid stroke="#E8EAF0" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#5B6478"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
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
                  border: "1px solid #E8EAF0",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => brl(v)}
              />
              <Bar dataKey="total" fill="#2A4BF0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
