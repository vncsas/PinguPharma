import { ArrowRight, BadgeAlert, CalendarClock, PackageSearch, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/design-system/ui/Button";
import { Card } from "@/design-system/ui/GlassCard";
import { StatCard } from "@/design-system/ui/StatCard";
import { AlertItem } from "./AlertItem";
import type { DashboardViewProps } from "../types";

export function ComplianceView({ metrics }: DashboardViewProps) {
  const total = (metrics?.lowStockCount ?? 0) + (metrics?.expiringSoonCount ?? 0);
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Alertas ativos"
          value={String(total)}
          delta="estoque + validade"
          deltaTone={total > 0 ? "down" : "neutral"}
          icon={<BadgeAlert className="size-4" />}
        />
        <StatCard
          label="Vencendo 30d"
          value={metrics ? String(metrics.expiringSoonCount) : "—"}
          icon={<CalendarClock className="size-4" />}
        />
        <StatCard
          label="Baixo estoque"
          value={metrics ? String(metrics.lowStockCount) : "—"}
          icon={<PackageSearch className="size-4" />}
        />
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Prioridades de compliance</h3>
            <p className="text-xs text-ink-muted">Ações que reduzem risco regulatório</p>
          </div>
          <Button variant="link" size="sm" asChild>
            <Link to="/auditoria">
              Auditoria <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <ul className="space-y-3">
          <AlertItem
            icon={<PackageSearch className="size-4" />}
            title={`${metrics?.lowStockCount ?? 0} produtos com baixo estoque`}
            description="Reponha antes de perder vendas por ruptura."
            tone="rose"
          />
          <AlertItem
            icon={<CalendarClock className="size-4" />}
            title={`${metrics?.expiringSoonCount ?? 0} lotes vencendo em 30 dias`}
            description="Rode promoção ou notifique fornecedor."
            tone="amber"
          />
          <AlertItem
            icon={<ShieldAlert className="size-4" />}
            title="Auditoria diária"
            description="Todas as ações críticas ficam registradas em /auditoria."
            tone="brand"
          />
        </ul>
      </Card>
    </>
  );
}
