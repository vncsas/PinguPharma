import { apiFetch, tokenStore, unitStore, ApiError } from "@/lib/api-client";

const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

export interface ConsumptionRowDTO {
  productId: string;
  productName: string;
  productSku: string;
  unitId: string;
  unitName: string;
  quantity: number;
  dispensationCount: number;
  totalValue: number;
}

export type CoverageStatus = "RUPTURE" | "CRITICAL" | "LOW" | "OK";

export interface StockCoverageRowDTO {
  productId: string;
  productName: string;
  productSku: string;
  unitId: string;
  unitName: string;
  currentStock: number;
  minStockAlert: number;
  avgDailyConsumption: number;
  coverageDays: number | null;
  status: CoverageStatus;
}

export interface LossRowDTO {
  movementId: string;
  createdAt: string;
  unitId: string;
  unitName: string;
  productId: string;
  productName: string;
  lotNumber: string | null;
  type: "LOSS_EXPIRED" | "LOSS_DAMAGE";
  quantity: number;
  value: number;
  reason: string | null;
  document: string | null;
  userName: string;
}

export interface LossReportDTO {
  rows: LossRowDTO[];
  totalQuantity: number;
  totalValue: number;
  byType: { type: string; quantity: number; value: number }[];
}

export interface DispensationSummaryRowDTO {
  key: string;
  label: string;
  dispensationCount: number;
  itemQuantity: number;
  totalValue: number;
}

export type DispensationGroupBy = "patient" | "prescriber";

function qs(params: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Baixa um CSV autenticado (token + unidade) e dispara o download no navegador. */
export async function downloadCsv(path: string, filename: string): Promise<void> {
  const doRequest = (token: string | null) => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const unitId = unitStore.get();
    if (unitId) headers["X-Unit-Id"] = unitId;
    return fetch(`${API_URL}${path}`, { headers });
  };
  let res = await doRequest(tokenStore.getAccess());
  if (res.status === 401) {
    const refresh = tokenStore.getRefresh();
    if (refresh) {
      const r = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (r.ok) {
        const data = await r.json();
        tokenStore.set(data.tokens.accessToken, data.tokens.refreshToken);
        res = await doRequest(data.tokens.accessToken);
      } else {
        tokenStore.clear();
      }
    }
  }
  if (!res.ok) {
    let body: { error?: string; message?: string } | null = null;
    try {
      body = await res.json();
    } catch {
      /* sem corpo */
    }
    throw new ApiError(res.status, body?.error ?? "REQUEST_ERROR", body?.message ?? "Falha ao exportar CSV");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const reportsApi = {
  consumption: (from: string, to: string, productId?: string) =>
    apiFetch<{ rows: ConsumptionRowDTO[] }>(`/reports/consumption${qs({ from, to, productId })}`),
  consumptionCsvPath: (from: string, to: string, productId?: string) =>
    `/reports/consumption.csv${qs({ from, to, productId })}`,

  stockCoverage: (productId?: string) =>
    apiFetch<{ rows: StockCoverageRowDTO[] }>(`/reports/stock-coverage${qs({ productId })}`),
  stockCoverageCsvPath: (productId?: string) => `/reports/stock-coverage.csv${qs({ productId })}`,

  losses: (from: string, to: string, productId?: string) =>
    apiFetch<{ report: LossReportDTO }>(`/reports/losses${qs({ from, to, productId })}`),
  lossesCsvPath: (from: string, to: string, productId?: string) =>
    `/reports/losses.csv${qs({ from, to, productId })}`,

  dispensations: (groupBy: DispensationGroupBy, from: string, to: string) =>
    apiFetch<{ groupBy: DispensationGroupBy; rows: DispensationSummaryRowDTO[] }>(
      `/reports/dispensations${qs({ groupBy, from, to })}`,
    ),
  dispensationsCsvPath: (groupBy: DispensationGroupBy, from: string, to: string) =>
    `/reports/dispensations.csv${qs({ groupBy, from, to })}`,
};
