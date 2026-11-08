import { apiBlob, apiFetch, saveBlob } from "@/lib/api-client";

export interface FinancialReportDTO {
  totals: {
    revenue: number;
    salesCount: number;
    itemsSold: number;
    averageTicket: number;
    cancelCount: number;
  };
  daily: { date: string; total: number; count: number }[];
  paymentBreakdown: { paymentMethod: string; total: number; count: number }[];
  topProducts: {
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    revenue: number;
  }[];
  topSellers: { userId: string; name: string; total: number; count: number }[];
}

export const reportsApi = {
  financial: (from: string, to: string) =>
    apiFetch<{ report: FinancialReportDTO }>(`/reports/financial?from=${from}&to=${to}`),
  downloadCsv: async (from: string, to: string) => {
    const blob = await apiBlob(`/reports/financial.csv?from=${from}&to=${to}`);
    saveBlob(blob, `financeiro_${from}_${to}.csv`);
  },
};
