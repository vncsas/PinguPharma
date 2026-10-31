import { apiFetch } from "@/lib/api-client";

export interface DashboardMetricsDTO {
  today: { dispensationsCount: number };
  dispensationsLast7Days: { date: string; count: number }[];
  latestDispensations: {
    id: string;
    createdAt: string;
    userName: string;
    patientName: string | null;
    status: string;
  }[];
  lowStockCount: number;
  expiringSoonCount: number;
  pendingTransfers: number;
  criticalStockCount: number;
  expiredBatchesCount: number;
  lossesLast30Days: { quantity: number; totalValue: number };
  topConsumed: { productId: string; productName: string; productSku: string; quantity: number }[];
}

export const dashboardApi = {
  metrics: () => apiFetch<{ metrics: DashboardMetricsDTO }>("/dashboard/metrics"),
};
