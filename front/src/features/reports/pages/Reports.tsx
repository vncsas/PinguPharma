import { useState } from "react";
import { Topbar } from "@/design-system/layout/Topbar";
import { Button } from "@/design-system/ui/Button";
import { Card } from "@/design-system/ui/GlassCard";
import { ErrorState } from "@/design-system/ui/ErrorState";
import { reportsApi } from "@/features/reports/api";
import { useFinancialReport } from "@/features/reports/hooks";
import { Download } from "lucide-react";
import { PeriodFilter } from "../components/PeriodFilter";
import { ReportKpis } from "../components/ReportKpis";
import { DailyRevenueCard } from "../components/DailyRevenueCard";
import { PaymentBreakdownCard } from "../components/PaymentBreakdownCard";
import { TopProductsTable } from "../components/TopProductsTable";
import { TopSellersTable } from "../components/TopSellersTable";
import { isoDate } from "../utils";

export default function ReportsPage() {
  const [from, setFrom] = useState(isoDate(-29));
  const [to, setTo] = useState(isoDate(0));

  const q = useFinancialReport(from, to);

  const report = q.data?.report;

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

      {q.isError && (
        <Card>
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        </Card>
      )}

      <PeriodFilter
        from={from}
        to={to}
        onChange={(f, t) => {
          setFrom(f);
          setTo(t);
        }}
      />

      <ReportKpis report={report} />

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
        <DailyRevenueCard report={report} isLoading={q.isLoading} />

        <PaymentBreakdownCard report={report} isLoading={q.isLoading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <TopProductsTable report={report} isLoading={q.isLoading} />

        <TopSellersTable report={report} isLoading={q.isLoading} />
      </div>
    </div>
  );
}
