import { useMemo, useState } from "react";
import { Topbar } from "@/design-system/layout/Topbar";
import { useAuth } from "@/lib/auth-context";
import { ComplianceView } from "../components/ComplianceView";
import { EstoqueView } from "../components/EstoqueView";
import { FinanceiroView } from "../components/FinanceiroView";
import { GeralView } from "../components/GeralView";
import { VendasView } from "../components/VendasView";
import { DASHBOARD_TABS } from "../constants";
import { useDashboardMetrics } from "../hooks";
import { summarizeWeek } from "../utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardMetrics();
  const [tab, setTab] = useState("geral");
  const metrics = data?.metrics;
  const week = useMemo(() => summarizeWeek(metrics), [metrics]);

  const availableTabs =
    user?.role === "SELLER" ? DASHBOARD_TABS.filter((t) => t.key !== "financeiro") : DASHBOARD_TABS;
  const view = { metrics, isLoading, week };

  return (
    <div className="space-y-6">
      <Topbar title="Dashboard" tabs={availableTabs} activeTab={tab} onTabChange={setTab} />

      {tab === "geral" && <GeralView {...view} />}
      {tab === "vendas" && <VendasView {...view} />}
      {tab === "estoque" && <EstoqueView {...view} />}
      {tab === "compliance" && <ComplianceView {...view} />}
      {tab === "financeiro" && <FinanceiroView {...view} />}
    </div>
  );
}
