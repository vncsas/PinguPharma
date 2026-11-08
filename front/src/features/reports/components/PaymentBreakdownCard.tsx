import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/design-system/ui/GlassCard";
import { LegendItem } from "@/design-system/ui/Donut";
import { paymentLabel } from "@/features/sales/constants";
import { brl } from "@/lib/utils";
import type { FinancialReportDTO } from "../api";

const PIE_COLORS = ["#2A4BF0", "#F58220", "#00B69A", "#F5B424", "#EF4A5F"];

export function PaymentBreakdownCard({
  report,
  isLoading,
}: {
  report: FinancialReportDTO | undefined;
  isLoading: boolean;
}) {
  return (
    <Card className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-ink">Formas de pagamento</h3>
        <p className="text-xs text-ink-muted">Distribuição por método</p>
      </div>
      <div className="h-56">
        {isLoading || !report || report.paymentBreakdown.length === 0 ? (
          <div className="h-full grid place-items-center text-sm text-ink-muted">
            Sem dados no período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={report.paymentBreakdown.map((p) => ({
                  name: paymentLabel(p.paymentMethod),
                  value: p.total,
                }))}
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {report.paymentBreakdown.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => brl(v)} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {report?.paymentBreakdown.map((p, i) => (
          <LegendItem
            key={p.paymentMethod}
            color={PIE_COLORS[i % PIE_COLORS.length]}
            label={`${paymentLabel(p.paymentMethod)} · ${p.count}`}
          />
        ))}
      </div>
    </Card>
  );
}
