import {
  ArrowRight,
  Boxes,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  PackageSearch,
  Receipt,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/design-system/ui/Button";
import { Donut, LegendItem } from "@/design-system/ui/Donut";
import { Card } from "@/design-system/ui/GlassCard";
import { StatCard } from "@/design-system/ui/StatCard";
import { brl } from "@/lib/utils";
import { LatestSalesTable } from "./LatestSalesTable";
import { MiniCalendar } from "./MiniCalendar";
import { QuickAction } from "./QuickAction";
import { RevenueChart } from "./RevenueChart";
import type { DashboardViewProps } from "../types";

export function GeralView({ metrics, isLoading, week }: DashboardViewProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Faturamento hoje"
          value={metrics ? brl(metrics.today.revenue) : "—"}
          delta={metrics ? `${metrics.today.salesCount} vendas` : undefined}
          deltaTone="up"
          icon={<DollarSign className="size-4" />}
          footer="24 horas"
        />
        <StatCard
          label="Últimos 7 dias"
          value={brl(week.total)}
          delta={`${week.count} pedidos`}
          deltaTone="up"
          icon={<TrendingUp className="size-4" />}
          footer="ciclo semanal"
        />
        <StatCard
          label="Estoque em alerta"
          value={metrics ? String(metrics.lowStockCount) : "—"}
          delta="ação"
          deltaTone="down"
          icon={<PackageSearch className="size-4" />}
          footer="≤ mínimo"
        />
        <StatCard
          label="Vencendo em 30d"
          value={metrics ? String(metrics.expiringSoonCount) : "—"}
          delta="verificar"
          deltaTone="down"
          icon={<CalendarClock className="size-4" />}
          footer="lotes ativos"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
        <Card className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-ink">Curva de receita</h3>
              <p className="text-xs text-ink-muted">Últimos 7 dias · vendas concluídas</p>
            </div>
            <Button variant="link" size="sm" asChild>
              <Link to="/relatorios">
                Relatório <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          <RevenueChart series={metrics?.revenueLast7Days} isLoading={isLoading} />
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="space-y-3">
            <h3 className="text-sm font-semibold">Alertas</h3>
            <div className="grid place-items-center">
              <Donut
                value={metrics?.lowStockCount ?? 0}
                total={Math.max(metrics?.lowStockCount ?? 0, 10)}
                colorA="#2A4BF0"
                colorB="#E8EAF0"
                size={130}
              />
            </div>
            <div className="flex justify-center gap-4">
              <LegendItem color="#2A4BF0" label="Alerta" />
              <LegendItem color="#E8EAF0" label="Ok" />
            </div>
          </Card>
          <Card className="space-y-3">
            <h3 className="text-sm font-semibold">Vencendo</h3>
            <div className="grid place-items-center">
              <Donut
                value={metrics?.expiringSoonCount ?? 0}
                total={Math.max(metrics?.expiringSoonCount ?? 0, 10)}
                colorA="#F58220"
                colorB="#E8EAF0"
                size={130}
              />
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
              <Link to="/vendas">
                Ver todas <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          <LatestSalesTable rows={metrics?.latestSales} isLoading={isLoading} />
        </div>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Agenda</h3>
            <div className="flex gap-1">
              <button className="grid size-6 place-items-center rounded hover:bg-surface-alt text-ink-muted">
                <ChevronLeft className="size-3.5" />
              </button>
              <button className="grid size-6 place-items-center rounded hover:bg-surface-alt text-ink-muted">
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
          <MiniCalendar />
          <div className="divider" />
          <div className="space-y-3">
            <QuickAction
              icon={<ShoppingBag className="size-4" />}
              title="Abrir PDV"
              subtitle="Venda em 3 cliques"
              href="/pdv"
            />
            <QuickAction
              icon={<Receipt className="size-4" />}
              title="Histórico"
              subtitle="Consulta e cancelamento"
              href="/vendas"
            />
            <QuickAction
              icon={<Boxes className="size-4" />}
              title="Entrada estoque"
              subtitle="Novo lote"
              href="/estoque"
            />
          </div>
        </Card>
      </div>
    </>
  );
}
