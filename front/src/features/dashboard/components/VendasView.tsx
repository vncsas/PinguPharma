import { ArrowRight, DollarSign, Receipt, ShoppingBag, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/design-system/ui/Button";
import { Card } from "@/design-system/ui/GlassCard";
import { StatCard } from "@/design-system/ui/StatCard";
import { brl } from "@/lib/utils";
import { LatestSalesTable } from "./LatestSalesTable";
import { RevenueChart } from "./RevenueChart";
import type { DashboardViewProps } from "../types";

export function VendasView({ metrics, isLoading, week }: DashboardViewProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Vendas hoje"
          value={metrics ? String(metrics.today.salesCount) : "—"}
          delta={metrics ? brl(metrics.today.revenue) : ""}
          deltaTone="up"
          icon={<ShoppingBag className="size-4" />}
        />
        <StatCard
          label="Pedidos 7d"
          value={String(week.count)}
          delta={`${brl(week.total)} receita`}
          deltaTone="up"
          icon={<Receipt className="size-4" />}
        />
        <StatCard
          label="Ticket médio"
          value={brl(week.avgTicket)}
          delta="7d"
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard
          label="Última venda"
          value={metrics?.latestSales?.[0] ? brl(metrics.latestSales[0].totalAmount) : "—"}
          delta={metrics?.latestSales?.[0]?.userName ?? ""}
          icon={<DollarSign className="size-4" />}
        />
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Curva de receita (7 dias)</h3>
            <p className="text-xs text-ink-muted">Vendas concluídas</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/pdv">
              <ShoppingBag className="size-4" /> Nova venda
            </Link>
          </Button>
        </div>
        <RevenueChart series={metrics?.revenueLast7Days} isLoading={isLoading} />
      </Card>

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
    </>
  );
}
