import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Input } from "@/design-system/components/Input";
import { StatCard } from "@/design-system/components/StatCard";
import { Skeleton } from "@/design-system/components/Skeleton";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/components/Table";
import { LegendItem } from "@/design-system/components/Donut";
import { reportsApi } from "@/features/reports/api";
import { brl, dayShort } from "@/lib/utils";
import {
  Ban,
  Download,
  Package,
  ReceiptText,
  TrendingUp,
  Users,
} from "lucide-react";

const PAY_LABEL: Record<string, string> = {
  CASH: "Dinheiro",
  CREDIT: "Crédito",
  DEBIT: "Débito",
  PIX: "PIX",
  OTHER: "Outro",
};
const PIE_COLORS = ["#2A4BF0", "#F58220", "#00B69A", "#F5B424", "#EF4A5F"];

function isoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [from, setFrom] = useState(isoDate(-29));
  const [to, setTo] = useState(isoDate(0));

  const q = useQuery({
    queryKey: ["reports", from, to],
    queryFn: () => reportsApi.financial(from, to),
  });

  const report = q.data?.report;

  const dailyChart = useMemo(
    () => report?.daily.map((d) => ({ ...d, day: dayShort(d.date) })) ?? [],
    [report],
  );

  return (
    <div className="space-y-6">
      <Topbar
        title="Relatórios financeiros"
        actions={
          <Button size="sm" onClick={() => reportsApi.downloadCsv(from, to)}>
            <Download className="size-4" /> Exportar CSV
          </Button>
        }
      />

      <Card className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="grid grid-cols-2 gap-3 max-w-md flex-1">
          <div>
            <label className="text-xs font-medium text-ink-muted">De</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted">Até</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
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
              onClick={() => { setFrom(isoDate(-p.d)); setTo(isoDate(0)); }}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          label="Faturamento"
          value={report ? brl(report.totals.revenue) : "—"}
          delta={report ? `${report.totals.salesCount} pedidos` : undefined}
          deltaTone="up"
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard
          label="Ticket médio"
          value={report ? brl(report.totals.averageTicket) : "—"}
          delta="por pedido"
          icon={<ReceiptText className="size-4" />}
        />
        <StatCard
          label="Itens vendidos"
          value={report ? String(report.totals.itemsSold) : "—"}
          delta="unidades"
          icon={<Package className="size-4" />}
        />
        <StatCard
          label="Vendas canceladas"
          value={report ? String(report.totals.cancelCount) : "—"}
          delta="período"
          deltaTone={report && report.totals.cancelCount > 0 ? "down" : "neutral"}
          icon={<Ban className="size-4" />}
        />
        <StatCard
          label="Vendedores ativos"
          value={report ? String(report.topSellers.length) : "—"}
          delta="registraram vendas"
          icon={<Users className="size-4" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
        <Card className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-ink">Faturamento diário</h3>
            <p className="text-xs text-ink-muted">Período selecionado</p>
          </div>
          <div className="h-64">
            {q.isLoading || !report ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChart}>
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

        <Card className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-ink">Formas de pagamento</h3>
            <p className="text-xs text-ink-muted">Distribuição por método</p>
          </div>
          <div className="h-56">
            {q.isLoading || !report || report.paymentBreakdown.length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-ink-muted">
                Sem dados no período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={report.paymentBreakdown.map((p) => ({
                      name: PAY_LABEL[p.paymentMethod] ?? p.paymentMethod,
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
                label={`${PAY_LABEL[p.paymentMethod] ?? p.paymentMethod} · ${p.count}`}
              />
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-ink">Top produtos por receita</h3>
          <TableShell>
            <Table>
              <thead>
                <tr>
                  <Th>Produto</Th>
                  <Th className="text-right">Qtd</Th>
                  <Th className="text-right">Receita</Th>
                </tr>
              </thead>
              <tbody>
                {q.isLoading || !report ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Tr key={i}><Td colSpan={3}><Skeleton className="h-4" /></Td></Tr>
                  ))
                ) : report.topProducts.length === 0 ? (
                  <Tr><Td colSpan={3} className="text-center text-ink-muted py-8">Sem dados</Td></Tr>
                ) : (
                  report.topProducts.map((p) => (
                    <Tr key={p.productId}>
                      <Td>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-ink-muted font-mono">{p.sku}</p>
                      </Td>
                      <Td className="text-right">{p.quantity}</Td>
                      <Td className="text-right font-semibold">{brl(p.revenue)}</Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableShell>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-semibold text-ink">Vendedores</h3>
          <TableShell>
            <Table>
              <thead>
                <tr>
                  <Th>Vendedor</Th>
                  <Th className="text-right">Pedidos</Th>
                  <Th className="text-right">Faturamento</Th>
                </tr>
              </thead>
              <tbody>
                {q.isLoading || !report ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Tr key={i}><Td colSpan={3}><Skeleton className="h-4" /></Td></Tr>
                  ))
                ) : report.topSellers.length === 0 ? (
                  <Tr><Td colSpan={3} className="text-center text-ink-muted py-8">Sem dados</Td></Tr>
                ) : (
                  report.topSellers.map((s) => (
                    <Tr key={s.userId}>
                      <Td className="font-medium">{s.name}</Td>
                      <Td className="text-right">{s.count}</Td>
                      <Td className="text-right font-semibold">{brl(s.total)}</Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableShell>
        </div>
      </div>
    </div>
  );
}
