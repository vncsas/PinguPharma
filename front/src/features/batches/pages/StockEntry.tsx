import { CalendarClock, Package, PackageCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Topbar } from "@/design-system/layout/Topbar";
import { StatCard } from "@/design-system/ui/StatCard";
import { BatchForm } from "../components/BatchForm";
import { BatchesTable } from "../components/BatchesTable";
import { StockRulesCard } from "../components/StockRulesCard";
import { useBatches } from "../hooks";
import { summarizeBatches } from "../utils";

export default function StockEntryPage() {
  const [filterExpiring, setFilterExpiring] = useState<number | undefined>(undefined);
  const batches = useBatches({ expiringWithinDays: filterExpiring, pageSize: 50 });
  const kpis = useMemo(() => summarizeBatches(batches.data?.data ?? []), [batches.data]);

  return (
    <div className="space-y-6">
      <Topbar title="Entrada de estoque" />

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Lotes ativos"
          value={String(kpis.total)}
          icon={<Package className="size-4" />}
        />
        <StatCard
          label="Unidades em estoque"
          value={String(kpis.units)}
          icon={<PackageCheck className="size-4" />}
        />
        <StatCard
          label="Vencendo em 30d"
          value={String(kpis.expiringSoon)}
          delta="atenção"
          deltaTone="down"
          icon={<CalendarClock className="size-4" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
        <BatchForm />
        <StockRulesCard />
      </div>

      <BatchesTable
        batches={batches}
        filterExpiring={filterExpiring}
        onFilterChange={setFilterExpiring}
      />
    </div>
  );
}
