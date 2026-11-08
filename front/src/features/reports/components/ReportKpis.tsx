import { StatCard } from "@/design-system/ui/StatCard";
import { brl } from "@/lib/utils";
import { Ban, Package, ReceiptText, TrendingUp, Users } from "lucide-react";
import type { FinancialReportDTO } from "../api";

export function ReportKpis({ report }: { report: FinancialReportDTO | undefined }) {
  return (
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
  );
}
