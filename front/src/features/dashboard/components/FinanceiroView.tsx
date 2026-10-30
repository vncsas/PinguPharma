import { ArrowRight, DollarSign, TrendingUp, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/design-system/ui/Button";
import { Card } from "@/design-system/ui/GlassCard";
import { Skeleton } from "@/design-system/ui/Skeleton";
import { StatCard } from "@/design-system/ui/StatCard";
import { brl, dayShort } from "@/lib/utils";
import type { DashboardViewProps } from "../types";

export function FinanceiroView({ metrics, isLoading, week }: DashboardViewProps) {
  const daily = metrics?.revenueLast7Days ?? [];
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Receita hoje"
          value={metrics ? brl(metrics.today.revenue) : "—"}
          delta={metrics ? `${metrics.today.salesCount} pedidos` : ""}
          deltaTone="up"
          icon={<DollarSign className="size-4" />}
        />
        <StatCard
          label="Receita 7d"
          value={brl(week.total)}
          delta={`${week.count} pedidos`}
          deltaTone="up"
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard
          label="Ticket médio"
          value={brl(week.avgTicket)}
          delta="período semanal"
          icon={<Wallet className="size-4" />}
        />
        <StatCard
          label="Melhor dia (7d)"
          value={daily.length ? brl(Math.max(...daily.map((d) => d.total))) : "—"}
          delta="pico"
          icon={<TrendingUp className="size-4" />}
        />
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Faturamento diário</h3>
            <p className="text-xs text-ink-muted">7 dias</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/relatorios">
              Relatório completo <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <div className="h-64">
          {isLoading || daily.length === 0 ? (
            <Skeleton className="h-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily.map((d) => ({ ...d, day: dayShort(d.date) }))}>
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
                    borderRadius: 8,
                    border: "1px solid #E8EAF0",
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

      <Card className="space-y-3">
        <h3 className="text-base font-semibold">Detalhamento</h3>
        <p className="text-xs text-ink-muted">
          O relatório completo (top produtos, top vendedores, formas de pagamento, export CSV) está
          em{" "}
          <Link to="/relatorios" className="text-brand-500 underline">
            Relatórios
          </Link>
          .
        </p>
      </Card>
    </>
  );
}
