import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
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
import { STAFF_ROLES } from "@/lib/roles";
import {
  ArrowLeftRight,
  ArrowRight,
  BadgeAlert,
  PackageX,
  Trash2,
  Boxes,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  History,
  PackageSearch,
  Pill,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

const TABS = [
  { key: "geral", label: "Geral" },
  { key: "estoque", label: "Estoque" },
  { key: "conformidade", label: "Conformidade" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const isStaff = !!user && STAFF_ROLES.includes(user.role);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: dashboardApi.metrics,
  });
  const [tab, setTab] = useState("geral");
  const metrics = data?.metrics;

  const weekCount = useMemo(
    () => metrics?.dispensationsLast7Days.reduce((s, d) => s + d.count, 0) ?? 0,
    [metrics],
  );

  return (
    <div className="space-y-6">
      <Topbar title="Dashboard" tabs={TABS} activeTab={tab} onTabChange={setTab} />

      {isError && (
        <p className="text-sm text-accent-rose bg-accent-rose/5 border border-accent-rose/20 rounded-lg px-3 py-2">
          Não foi possível carregar os indicadores.
        </p>
      )}

      {tab === "geral" && <GeralView metrics={metrics} isLoading={isLoading} weekCount={weekCount} isStaff={isStaff} />}
      {tab === "estoque" && <EstoqueView metrics={metrics} isStaff={isStaff} />}
      {tab === "conformidade" && <ConformidadeView metrics={metrics} />}
    </div>
  );
}

// ---------- shared components ----------

function ChartDispensations({ series, isLoading }: { series: any[] | undefined; isLoading: boolean }) {
  return (
    <div className="h-60">
      {isLoading || !series ? (
        <Skeleton className="h-full" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series.map((d) => ({ ...d, day: dayShort(d.date) }))}>
            <defs>
              <linearGradient id="disp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2A4BF0" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#2A4BF0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E8EAF0" vertical={false} />
            <XAxis dataKey="day" stroke="#5B6478" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#5B6478" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
            <Tooltip
              contentStyle={{ background: "#fff", borderRadius: 8, border: "1px solid #E8EAF0", fontSize: 12 }}
              formatter={(v: number) => [v, "Dispensações"]}
            />
            <Area type="monotone" dataKey="count" stroke="#2A4BF0" strokeWidth={2} fill="url(#disp)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function LatestTable({ rows, isLoading }: { rows?: any[]; isLoading: boolean }) {
  return (
    <TableShell>
      <Table>
        <thead>
          <tr>
            <Th>Data</Th>
            <Th>Dispensador</Th>
            <Th>Paciente</Th>
            <Th>Situação</Th>
          </tr>
        </thead>
        <tbody>
          {isLoading || !rows ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Tr key={i}><Td colSpan={4}><Skeleton className="h-4" /></Td></Tr>
            ))
          ) : rows.length === 0 ? (
            <Tr><Td colSpan={4} className="text-center text-ink-muted py-8">Nenhuma dispensação registrada.</Td></Tr>
          ) : (
            rows.map((d) => (
              <Tr key={d.id}>
                <Td className="text-ink-muted whitespace-nowrap">{dateBR(d.createdAt)}</Td>
                <Td className="font-medium">{d.userName}</Td>
                <Td>{d.patientName ?? <span className="text-ink-subtle">Não identificado</span>}</Td>
                <Td>
                  <Badge tone={d.status === "COMPLETED" ? "success" : "danger"} dot>
                    {d.status === "COMPLETED" ? "Concluída" : "Cancelada"}
                  </Badge>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </TableShell>
  );
}

// ---------- tab: Geral ----------

function GeralView({ metrics, isLoading, weekCount, isStaff }: any) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Dispensações hoje" value={metrics ? String(metrics.today.dispensationsCount) : "—"} icon={<Pill className="size-4" />} footer="24 horas" />
        <StatCard label="Últimos 7 dias" value={metrics ? String(weekCount) : "—"} icon={<TrendingUp className="size-4" />} footer="dispensações concluídas" />
        <StatCard label="Estoque em alerta" value={metrics ? String(metrics.lowStockCount) : "—"} delta="ação" deltaTone="down" icon={<PackageSearch className="size-4" />} footer="≤ mínimo" />
        <StatCard label="Vencendo em 30d" value={metrics ? String(metrics.expiringSoonCount) : "—"} delta="verificar" deltaTone="down" icon={<CalendarClock className="size-4" />} footer="lotes ativos" />
        <StatCard label="Estoque crítico" value={metrics ? String(metrics.criticalStockCount) : "—"} delta="cobertura ≤ 7 dias" deltaTone={metrics?.criticalStockCount ? "down" : "neutral"} icon={<PackageX className="size-4" />} footer="ruptura iminente" />
        {isStaff && <StatCard label="Transferências pendentes" value={metrics ? String(metrics.pendingTransfers) : "—"} icon={<ArrowLeftRight className="size-4" />} footer={<Link to="/transferencias" className="text-brand-500 hover:underline">Ver transferências</Link>} />}
      </div>

      <Card className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">Dispensações por dia</h3>
          <p className="text-xs text-ink-muted">Últimos 7 dias · concluídas</p>
        </div>
        <ChartDispensations series={metrics?.dispensationsLast7Days} isLoading={isLoading} />
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
        <div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold">Últimas dispensações</h3>
              <p className="text-xs text-ink-muted">5 mais recentes</p>
            </div>
            {isStaff && (
              <Button variant="link" size="sm" asChild>
                <Link to="/dispensacoes">Ver todas <ArrowRight className="size-3.5" /></Link>
              </Button>
            )}
          </div>
          <LatestTable rows={metrics?.latestDispensations} isLoading={isLoading} />
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
            <QuickAction icon={<Pill className="size-4" />} title="Nova dispensação" subtitle="Atendimento ao paciente" href="/dispensacao" />
            {isStaff && <QuickAction icon={<History className="size-4" />} title="Histórico" subtitle="Consulta e cancelamento" href="/dispensacoes" />}
            {isStaff && <QuickAction icon={<Boxes className="size-4" />} title="Entrada de estoque" subtitle="Novo lote" href="/estoque" />}
          </div>
        </Card>
      </div>
    </>
  );
}

// ---------- tab: Estoque ----------

function EstoqueView({ metrics, isStaff }: any) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard label="Estoque em alerta" value={metrics ? String(metrics.lowStockCount) : "—"} delta="reposição recomendada" deltaTone="down" icon={<PackageSearch className="size-4" />} />
        <StatCard label="Estoque crítico" value={metrics ? String(metrics.criticalStockCount) : "—"} delta="cobertura ≤ 7 dias" deltaTone={metrics?.criticalStockCount ? "down" : "neutral"} icon={<PackageX className="size-4" />} />
        <StatCard label="Vencendo em 30d" value={metrics ? String(metrics.expiringSoonCount) : "—"} delta="lotes ativos" deltaTone="down" icon={<CalendarClock className="size-4" />} />
        <StatCard label="Lotes vencidos" value={metrics ? String(metrics.expiredBatchesCount) : "—"} delta="com saldo" deltaTone={metrics?.expiredBatchesCount ? "down" : "neutral"} icon={<CalendarClock className="size-4" />} />
        <StatCard
          label="Perdas (30 dias)"
          value={metrics ? String(metrics.lossesLast30Days.quantity) : "—"}
          delta={metrics ? brl(metrics.lossesLast30Days.totalValue) : undefined}
          icon={<Trash2 className="size-4" />}
          footer="unidades baixadas por vencimento/avaria"
        />
        {isStaff && (
          <Link to="/transferencias" className="block">
            <StatCard label="Transferências pendentes" value={metrics ? String(metrics.pendingTransfers) : "—"} delta={metrics?.pendingTransfers ? "ação" : undefined} deltaTone="down" icon={<ArrowLeftRight className="size-4" />} footer="solicitadas ou em trânsito" />
          </Link>
        )}
      </div>

      <Card className="space-y-3">
        <h3 className="text-base font-semibold">Mais consumidos (30 dias)</h3>
        {!metrics ? (
          <Skeleton className="h-16" />
        ) : metrics.topConsumed.length === 0 ? (
          <p className="text-sm text-ink-muted">Sem consumo registrado no período.</p>
        ) : (
          <ol className="divide-y divide-line">
            {metrics.topConsumed.map((p: any, i: number) => (
              <li key={p.productId} className="flex items-center gap-3 py-2 text-sm">
                <span className="w-5 text-ink-muted">{i + 1}.</span>
                <span className="flex-1 font-medium">{p.productName} <span className="text-xs text-ink-muted font-mono">{p.productSku}</span></span>
                <span className="font-semibold">{p.quantity}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

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
          <h3 className="text-base font-semibold">Validade dos lotes</h3>
          <div className="grid place-items-center py-4">
            <Donut value={metrics?.expiringSoonCount ?? 0} total={Math.max(metrics?.expiringSoonCount ?? 0, 20)} colorA="#F58220" colorB="#00B69A" size={180} />
          </div>
          <div className="flex justify-center gap-4">
            <LegendItem color="#F58220" label={`${metrics?.expiringSoonCount ?? 0} vencendo`} />
            <LegendItem color="#00B69A" label="Ok" />
          </div>
        </Card>
      </div>

      {isStaff && (
        <Card className="space-y-3">
          <h3 className="text-base font-semibold">Ações rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <QuickAction icon={<Boxes className="size-4" />} title="Entrada de estoque" subtitle="Cadastre um novo lote" href="/estoque" />
            <QuickAction icon={<PackageSearch className="size-4" />} title="Produtos em alerta" subtitle="Consultar catálogo" href="/produtos" />
            <QuickAction icon={<CalendarClock className="size-4" />} title="Lotes a vencer" subtitle="Ver na tela de estoque" href="/estoque" />
          </div>
        </Card>
      )}
    </>
  );
}

// ---------- tab: Conformidade ----------

function ConformidadeView({ metrics }: any) {
  const { user } = useAuth();
  const total = (metrics?.lowStockCount ?? 0) + (metrics?.expiringSoonCount ?? 0);
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Alertas ativos" value={String(total)} delta="estoque + validade" deltaTone={total > 0 ? "down" : "neutral"} icon={<BadgeAlert className="size-4" />} />
        <StatCard label="Vencendo em 30d" value={metrics ? String(metrics.expiringSoonCount) : "—"} icon={<CalendarClock className="size-4" />} />
        <StatCard label="Estoque em alerta" value={metrics ? String(metrics.lowStockCount) : "—"} icon={<PackageSearch className="size-4" />} />
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Prioridades</h3>
            <p className="text-xs text-ink-muted">Ações que reduzem o risco de desabastecimento e perdas</p>
          </div>
          {user?.role === "ADMIN" && (
            <Button variant="link" size="sm" asChild>
              <Link to="/auditoria">Auditoria <ArrowRight className="size-3.5" /></Link>
            </Button>
          )}
        </div>
        <ul className="space-y-3">
          <AlertItem icon={<PackageSearch className="size-4" />} title={`${metrics?.lowStockCount ?? 0} produtos com estoque baixo`} description="Solicite reposição antes da ruptura." tone="rose" />
          <AlertItem icon={<CalendarClock className="size-4" />} title={`${metrics?.expiringSoonCount ?? 0} lotes vencendo em 30 dias`} description="Priorize a dispensação ou solicite remanejamento." tone="amber" />
          <AlertItem icon={<PackageX className="size-4" />} title={`${metrics?.criticalStockCount ?? 0} produtos com estoque crítico`} description="Cobertura de até 7 dias. Solicite transferência ou reposição." tone="rose" />
          <AlertItem icon={<CalendarClock className="size-4" />} title={`${metrics?.expiredBatchesCount ?? 0} lotes vencidos com saldo`} description="Registre a baixa por vencimento." tone="amber" />
          <AlertItem icon={<ShieldAlert className="size-4" />} title="Rastreabilidade" description="Todas as ações críticas ficam registradas na auditoria." tone="brand" />
        </ul>
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
