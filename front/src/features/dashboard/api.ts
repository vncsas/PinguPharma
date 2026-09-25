import { apiFetch } from "@/lib/api-client";

export interface DashboardMetricsDTO {
  today: { revenue: number; salesCount: number };
  revenueLast7Days: { date: string; total: number; count: number }[];
  latestSales: {
    id: string;
    createdAt: string;
    totalAmount: number;
    userName: string;
    clientName: string;
    status: string;
  }[];
  lowStockCount: number;
  expiringSoonCount: number;
}

export const dashboardApi = {
  metrics: () => apiFetch<{ metrics: DashboardMetricsDTO }>("/dashboard/metrics"),
};
