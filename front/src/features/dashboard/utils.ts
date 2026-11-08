import type { DashboardMetricsDTO } from "./api";
import type { WeekSummary } from "./types";

export function summarizeWeek(metrics: DashboardMetricsDTO | undefined): WeekSummary {
  const days = metrics?.revenueLast7Days ?? [];
  const total = days.reduce((sum, d) => sum + d.total, 0);
  const count = days.reduce((sum, d) => sum + d.count, 0);
  return { total, count, avgTicket: count > 0 ? total / count : 0 };
}
