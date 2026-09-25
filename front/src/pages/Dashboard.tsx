import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { dashboardApi } from "@/features/dashboard/api";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { StatCard } from "@/design-system/components/StatCard";
import { Badge } from "@/design-system/components/Badge";
import { Skeleton } from "@/design-system/components/Skeleton";
import { Button } from "@/design-system/components/Button";
import { Donut, LegendItem } from "@/design-system/components/Donut";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/components/Table";
import { brl, dateBR, dayShort } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowRight,
  BadgeAlert,
  Boxes,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  PackageSearch,
  Receipt,
  ShieldAlert,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";

const TABS = [
  { key: "geral", label: "Geral" },
  { key: "vendas", label: "Vendas" },
  { key: "estoque", label: "Estoque" },
  { key: "compliance", label: "Compliance" },
  { key: "financeiro", label: "Financeiro" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: dashboardApi.metrics,
  });
  const [tab, setTab] = useState("geral");
  const metrics = data?.metrics;

  const weekTotal = useMemo(
    () => metrics?.revenueLast7Days.reduce((s, d) => s + d.total, 0) ?? 0,
    [metrics],
  );
  const weekCount = useMemo(
    () => metrics?.revenueLast7Days.reduce((s, d) => s + d.count, 0) ?? 0,
    [metrics],
  );
  const avgTicket = weekCount > 0 ? weekTotal / weekCount : 0;

  const availableTabs = user?.role === "SELLER" ? TABS.filter((t) => t.key !== "financeiro") : TABS;

  return (
    <div className="space-y-6">
      <Topbar
        title="Dashboard"
        tabs={availableTabs}
        activeTab={tab}
        onTabChange={setTab}
      />

      {tab === "geral" && <GeralView metrics={metrics} isLoading={isLoading} weekTotal={weekTotal} weekCount={weekCount} />}
      {tab === "vendas" && <VendasView metrics={metrics} isLoading={isLoading} weekTotal={weekTotal} weekCount={weekCount} avgTicket={avgTicket} />}
      {tab === "estoque" && <EstoqueView metrics={metrics} isLoading={isLoading} />}
      {tab === "compliance" && <ComplianceView metrics={metrics} isLoading={isLoading} />}
      {tab === "financeiro" && <FinanceiroView metrics={metrics} isLoading={isLoading} weekTotal={weekTotal} weekCount={weekCount} avgTicket={avgTicket} />}
    </div>
  );
}

// ---------- shared components ----------

function ChartRevenue({ series, isLoading }: { series: any[] | undefined; isLoading: boolean }) {
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
            <YAxis stroke="#5B6478" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => brl(v)} width={70} />
            <Tooltip
              contentStyle={{ background: "#fff", borderRadius: 8, border: "1px solid #E8EAF0", fontSize: 12 }}
              formatter={(v: number) => brl(v)}
            />
            <Area type="monotone" dataKey="total" stroke="#2A4BF0" strokeWidth={2} fill="url(#rev)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function LatestSalesTable({ rows, isLoading }: { rows?: any[]; isLoading: boolean }) {
  return (
    <TableShell>
      <Table>
        <thead>
          <tr>
            <Th>Data</Th>
            <Th>Vendedor</Th>
            <Th>Cliente</Th>
            <Th>Status</Th>
            <Th className="text-right">Valor</Th>
          </tr>
        </thead>
        <tbody>
          {isLoading || !rows ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Tr key={i}><Td colSpan={5}><Skeleton className="h-4" /></Td></Tr>
            ))
          ) : rows.length === 0 ? (
            <Tr><Td colSpan={5} className="text-center text-ink-muted py-8">Nenhuma venda registrada.</Td></Tr>
          ) : (
            rows.map((s) => (
              <Tr key={s.id}>
                <Td className="text-ink-muted whitespace-nowrap">{dateBR(s.createdAt)}</Td>
                <Td className="font-medium">{s.userName}</Td>
                <Td>{s.clientName}</Td>
                <Td>
                  <Badge tone={s.status === "COMPLETED" ? "success" : "danger"} dot>
                    {s.status === "COMPLETED" ? "Concluída" : "Cancelada"}
                  </Badge>
                </Td>
                <Td className="text-right font-semibold">{brl(s.totalAmount)}</Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </TableShell>
  );
}

// ---------- tab: Geral ----------

function GeralView({ metrics, isLoading, weekTotal, weekCount }: any) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Faturamento hoje" value={metrics ? brl(metrics.today.revenue) : "—"} delta={metrics ? `${metrics.today.salesCount} vendas` : undefined} deltaTone="up" icon={<DollarSign className="size-4" />} footer="24 horas" />
        <StatCard label="Últimos 7 dias" value={brl(weekTotal)} delta={`${weekCount} pedidos`} deltaTone="up" icon={<TrendingUp className="size-4" />} footer="ciclo semanal" />
        <StatCard label="Estoque em alerta" value={metrics ? String(metrics.lowStockCount) : "—"} delta="ação" deltaTone="down" icon={<PackageSearch className="size-4" />} footer="≤ mínimo" />
        <StatCard label="Vencendo em 30d" value={metrics ? String(metrics.expiringSoonCount) : "—"} delta="verificar" deltaTone="down" icon={<CalendarClock className="size-4" />} footer="lotes ativos" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
        <Card className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-ink">Curva de receita</h3>
              <p className="text-xs text-ink-muted">Últimos 7 dias · vendas concluídas</p>
            </div>
            <Button variant="link" size="sm" asChild>
              <Link to="/relatorios">Relatório <ArrowRight className="size-3.5" /></Link>
            </Button>
          </div>
          <ChartRevenue series={metrics?.revenueLast7Days} isLoading={isLoading} />
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="space-y-3">
            <h3 className="text-sm font-semibold">Alertas</h3>
            <div className="grid place-items-center">
              <Donut value={metrics?.lowStockCount ?? 0} total={Math.max(metrics?.lowStockCount ?? 0, 10)} colorA="#2A4BF0" colorB="#E8EAF0" size={130} />
            </div>
            <div className="flex justify-center gap-4">
              <LegendItem color="#2A4BF0" label="Alerta" />
              <LegendItem color="#E8EAF0" label="Ok" />
            </div>
          </Card>
          <Card className="space-y-3">
            <h3 className="text-sm font-semibold">Vencendo</h3>
            <div className="grid place-items-center">
              <Donut value={metrics?.expiringSoonCount ?? 0} total={Math.max(metrics?.expiringSoonCount ?? 0, 10)} colorA="#F58220" colorB="#E8EAF0" size={130} />
            </div>
            <div className="flex justify-center gap-4">
              <LegendItem color="#F58220" label="≤ 30d" />
              <LegendItem color="#E8EAF0" label="Ok" />
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
        <div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold">Últimas vendas</h3>
              <p className="text-xs text-ink-muted">5 mais recentes</p>
            </div>
            <Button variant="link" size="sm" asChild>
              <Link to="/vendas">Ver todas <ArrowRight className="size-3.5" /></Link>
            </Button>
          </div>
          <LatestSalesTable rows={metrics?.latestSales} isLoading={isLoading} />
        </div>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Agenda</h3>
            <div className="flex gap-1">
              <button className="grid size-6 place-items-center rounded hover:bg-surface-alt text-ink-muted"><ChevronLeft className="size-3.5" /></button>
              <button className="grid size-6 place-items-center rounded hover:bg-surface-alt text-ink-muted"><ChevronRight className="size-3.5" /></button>
            </div>
          </div>
          <MiniCalendar />
          <div className="divider" />
          <div className="space-y-3">
            <QuickAction icon={<ShoppingBag className="size-4" />} title="Abrir PDV" subtitle="Venda em 3 cliques" href="/pdv" />
            <QuickAction icon={<Receipt className="size-4" />} title="Histórico" subtitle="Consulta e cancelamento" href="/vendas" />
            <QuickAction icon={<Boxes className="size-4" />} title="Entrada estoque" subtitle="Novo lote" href="/estoque" />
          </div>
        </Card>
      </div>
    </>
  );
}

// ---------- tab: Vendas ----------

function VendasView({ metrics, isLoading, weekTotal, weekCount, avgTicket }: any) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Vendas hoje" value={metrics ? String(metrics.today.salesCount) : "—"} delta={metrics ? brl(metrics.today.revenue) : ""} deltaTone="up" icon={<ShoppingBag className="size-4" />} />
        <StatCard label="Pedidos 7d" value={String(weekCount)} delta={`${brl(weekTotal)} receita`} deltaTone="up" icon={<Receipt className="size-4" />} />
        <StatCard label="Ticket médio" value={brl(avgTicket)} delta="7d" icon={<TrendingUp className="size-4" />} />
        <StatCard label="Última venda" value={metrics?.latestSales?.[0] ? brl(metrics.latestSales[0].totalAmount) : "—"} delta={metrics?.latestSales?.[0]?.userName ?? ""} icon={<DollarSign className="size-4" />} />
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Curva de receita (7 dias)</h3>
            <p className="text-xs text-ink-muted">Vendas concluídas</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/pdv"><ShoppingBag className="size-4" /> Nova venda</Link>
          </Button>
        </div>
        <ChartRevenue series={metrics?.revenueLast7Days} isLoading={isLoading} />
      </Card>

      <div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold">Últimas vendas</h3>
            <p className="text-xs text-ink-muted">5 mais recentes</p>
          </div>
          <Button variant="link" size="sm" asChild>
            <Link to="/vendas">Ver todas <ArrowRight className="size-3.5" /></Link>
          </Button>
        </div>
        <LatestSalesTable rows={metrics?.latestSales} isLoading={isLoading} />
      </div>
    </>
  );
}

// ---------- tab: Estoque ----------

function EstoqueView({ metrics, isLoading }: any) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Baixo estoque" value={metrics ? String(metrics.lowStockCount) : "—"} delta="ação recomendada" deltaTone="down" icon={<PackageSearch className="size-4" />} />
        <StatCard label="Vencendo 30d" value={metrics ? String(metrics.expiringSoonCount) : "—"} delta="lotes ativos" deltaTone="down" icon={<CalendarClock className="size-4" />} />
        <StatCard label="Ações rápidas" value="—" delta="ver abaixo" icon={<Boxes className="size-4" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="space-y-3">
          <h3 className="text-base font-semibold">Cobertura de estoque</h3>
          <div className="grid place-items-center py-4">
            <Donut value={metrics?.lowStockCount ?? 0} total={Math.max(metrics?.lowStockCount ?? 0, 20)} colorA="#EF4A5F" colorB="#12B76A" size={180} />
          </div>
          <div className="flex justify-center gap-4">
            <LegendItem color="#EF4A5F" label={`${metrics?.lowStockCount ?? 0} em alerta`} />
            <LegendItem color="#12B76A" label="Saudável" />
          </div>
        </Card>

        <Card className="space-y-3">
          <h3 className="text-base font-semibold">Compliance por validade</h3>
          <div className="grid place-items-center py-4">
            <Donut value={metrics?.expiringSoonCount ?? 0} total={Math.max(metrics?.expiringSoonCount ?? 0, 20)} colorA="#F58220" colorB="#00B69A" size={180} />
          </div>
          <div className="flex justify-center gap-4">
            <LegendItem color="#F58220" label={`${metrics?.expiringSoonCount ?? 0} vencendo`} />
            <LegendItem color="#00B69A" label="Ok" />
          </div>
        </Card>
      </div>

      <Card className="space-y-3">
        <h3 className="text-base font-semibold">Ações rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <QuickAction icon={<Boxes className="size-4" />} title="Entrada de estoque" subtitle="Cadastre um novo lote" href="/estoque" />
          <QuickAction icon={<PackageSearch className="size-4" />} title="Produtos em alerta" subtitle="Filtrar baixo estoque" href="/produtos" />
          <QuickAction icon={<CalendarClock className="size-4" />} title="Vencendo em 7d" subtitle="Ver na tela de estoque" href="/estoque" />
        </div>
      </Card>
    </>
  );
}

// ---------- tab: Compliance ----------

function ComplianceView({ metrics, isLoading }: any) {
  const total = (metrics?.lowStockCount ?? 0) + (metrics?.expiringSoonCount ?? 0);
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Alertas ativos" value={String(total)} delta="estoque + validade" deltaTone={total > 0 ? "down" : "neutral"} icon={<BadgeAlert className="size-4" />} />
        <StatCard label="Vencendo 30d" value={metrics ? String(metrics.expiringSoonCount) : "—"} icon={<CalendarClock className="size-4" />} />
        <StatCard label="Baixo estoque" value={metrics ? String(metrics.lowStockCount) : "—"} icon={<PackageSearch className="size-4" />} />
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Prioridades de compliance</h3>
            <p className="text-xs text-ink-muted">Ações que reduzem risco regulatório</p>
          </div>
          <Button variant="link" size="sm" asChild>
            <Link to="/auditoria">Auditoria <ArrowRight className="size-3.5" /></Link>
          </Button>
        </div>
        <ul className="space-y-3">
          <AlertItem icon={<PackageSearch className="size-4" />} title={`${metrics?.lowStockCount ?? 0} produtos com baixo estoque`} description="Reponha antes de perder vendas por ruptura." tone="rose" />
          <AlertItem icon={<CalendarClock className="size-4" />} title={`${metrics?.expiringSoonCount ?? 0} lotes vencendo em 30 dias`} description="Rode promoção ou notifique fornecedor." tone="amber" />
          <AlertItem icon={<ShieldAlert className="size-4" />} title="Auditoria diária" description="Todas as ações críticas ficam registradas em /auditoria." tone="brand" />
        </ul>
      </Card>
    </>
  );
}

// ---------- tab: Financeiro ----------

function FinanceiroView({ metrics, isLoading, weekTotal, weekCount, avgTicket }: any) {
  const daily = metrics?.revenueLast7Days ?? [];
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Receita hoje" value={metrics ? brl(metrics.today.revenue) : "—"} delta={metrics ? `${metrics.today.salesCount} pedidos` : ""} deltaTone="up" icon={<DollarSign className="size-4" />} />
        <StatCard label="Receita 7d" value={brl(weekTotal)} delta={`${weekCount} pedidos`} deltaTone="up" icon={<TrendingUp className="size-4" />} />
        <StatCard label="Ticket médio" value={brl(avgTicket)} delta="período semanal" icon={<Wallet className="size-4" />} />
        <StatCard label="Melhor dia (7d)" value={daily.length ? brl(Math.max(...daily.map((d: any) => d.total))) : "—"} delta="pico" icon={<TrendingUp className="size-4" />} />
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Faturamento diário</h3>
            <p className="text-xs text-ink-muted">7 dias</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/relatorios">Relatório completo <ArrowRight className="size-3.5" /></Link>
          </Button>
        </div>
        <div className="h-64">
          {isLoading || daily.length === 0 ? (
            <Skeleton className="h-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily.map((d: any) => ({ ...d, day: dayShort(d.date) }))}>
                <CartesianGrid stroke="#E8EAF0" vertical={false} />
                <XAxis dataKey="day" stroke="#5B6478" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#5B6478" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => brl(v)} width={70} />
                <Tooltip contentStyle={{ background: "#fff", borderRadius: 8, border: "1px solid #E8EAF0", fontSize: 12 }} formatter={(v: number) => brl(v)} />
                <Bar dataKey="total" fill="#2A4BF0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card className="space-y-3">
        <h3 className="text-base font-semibold">Detalhamento</h3>
        <p className="text-xs text-ink-muted">
          O relatório completo (top produtos, top vendedores, formas de pagamento, export CSV) está em <Link to="/relatorios" className="text-brand-500 underline">Relatórios</Link>.
        </p>
      </Card>
    </>
  );
}

// ---------- utils ----------

function QuickAction({ icon, title, subtitle, href }: { icon: React.ReactNode; title: string; subtitle: string; href: string }) {
  return (
    <Link to={href} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-alt transition-colors">
      <span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-ink leading-tight">{title}</p>
        <p className="text-xs text-ink-muted">{subtitle}</p>
      </div>
      <ArrowRight className="size-4 text-ink-muted" />
    </Link>
  );
}

function AlertItem({ icon, title, description, tone }: { icon: React.ReactNode; title: string; description: string; tone: "rose" | "amber" | "brand" }) {
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

function MiniCalendar() {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = today
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(/^./, (c) => c.toUpperCase());

  return (
    <div>
      <p className="text-xs font-semibold text-ink mb-2">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <div key={i} className="text-[10px] text-ink-subtle font-medium py-1">{d}</div>
        ))}
        {cells.map((d, i) => {
          const isToday = d === today.getDate();
          return (
            <div key={i} className={`text-[11px] py-1 rounded ${d === null ? "text-transparent" : isToday ? "bg-brand-500 text-white font-semibold" : "text-ink-muted hover:bg-surface-alt cursor-pointer"}`}>
              {d ?? 0}
            </div>
          );
        })}
      </div>
    </div>
  );
}
