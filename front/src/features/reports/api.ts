import { apiFetch, tokenStore } from "@/lib/api-client";

const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

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
    const token = tokenStore.getAccess();
    const res = await fetch(`${API_URL}/reports/financial.csv?from=${from}&to=${to}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Falha ao gerar CSV");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro_${from}_${to}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  },
};
