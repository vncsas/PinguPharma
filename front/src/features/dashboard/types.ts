import type { DashboardMetricsDTO } from "./api";

/** Totais dos últimos 7 dias, derivados de `revenueLast7Days`. */
export interface WeekSummary {
  total: number;
  count: number;
  avgTicket: number;
}

export interface DashboardViewProps {
  metrics: DashboardMetricsDTO | undefined;
  isLoading: boolean;
  week: WeekSummary;
}
