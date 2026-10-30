import { Boxes, CalendarClock, PackageSearch } from "lucide-react";
import { Donut, LegendItem } from "@/design-system/ui/Donut";
import { Card } from "@/design-system/ui/GlassCard";
import { StatCard } from "@/design-system/ui/StatCard";
import { QuickAction } from "./QuickAction";
import type { DashboardViewProps } from "../types";

export function EstoqueView({ metrics }: DashboardViewProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Baixo estoque"
          value={metrics ? String(metrics.lowStockCount) : "—"}
          delta="ação recomendada"
          deltaTone="down"
          icon={<PackageSearch className="size-4" />}
        />
        <StatCard
          label="Vencendo 30d"
          value={metrics ? String(metrics.expiringSoonCount) : "—"}
          delta="lotes ativos"
          deltaTone="down"
          icon={<CalendarClock className="size-4" />}
        />
        <StatCard
          label="Ações rápidas"
          value="—"
          delta="ver abaixo"
          icon={<Boxes className="size-4" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="space-y-3">
          <h3 className="text-base font-semibold">Cobertura de estoque</h3>
          <div className="grid place-items-center py-4">
            <Donut
              value={metrics?.lowStockCount ?? 0}
              total={Math.max(metrics?.lowStockCount ?? 0, 20)}
              colorA="#EF4A5F"
              colorB="#12B76A"
              size={180}
            />
          </div>
          <div className="flex justify-center gap-4">
            <LegendItem color="#EF4A5F" label={`${metrics?.lowStockCount ?? 0} em alerta`} />
            <LegendItem color="#12B76A" label="Saudável" />
          </div>
        </Card>

        <Card className="space-y-3">
          <h3 className="text-base font-semibold">Compliance por validade</h3>
          <div className="grid place-items-center py-4">
            <Donut
              value={metrics?.expiringSoonCount ?? 0}
              total={Math.max(metrics?.expiringSoonCount ?? 0, 20)}
              colorA="#F58220"
              colorB="#00B69A"
              size={180}
            />
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
          <QuickAction
            icon={<Boxes className="size-4" />}
            title="Entrada de estoque"
            subtitle="Cadastre um novo lote"
            href="/estoque"
          />
          <QuickAction
            icon={<PackageSearch className="size-4" />}
            title="Produtos em alerta"
            subtitle="Filtrar baixo estoque"
            href="/produtos"
          />
          <QuickAction
            icon={<CalendarClock className="size-4" />}
            title="Vencendo em 7d"
            subtitle="Ver na tela de estoque"
            href="/estoque"
          />
        </div>
      </Card>
    </>
  );
}
