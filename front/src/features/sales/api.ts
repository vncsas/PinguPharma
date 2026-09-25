import { apiFetch, tokenStore } from "@/lib/api-client";

const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

export type PaymentMethod = "CASH" | "CREDIT" | "DEBIT" | "PIX" | "OTHER";
export type SaleStatus = "COMPLETED" | "CANCELED";

export interface SaleItemDetailDTO {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  batchId: string | null;
  lotNumber: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleDetailDTO {
  id: string;
  userId: string;
  userName: string;
  customerId: string | null;
  customerName: string | null;
  clientName: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  status: SaleStatus;
  createdAt: string;
  updatedAt: string;
  items: SaleItemDetailDTO[];
}

export interface SaleListRowDTO {
  id: string;
  userId: string;
  userName: string;
  customerName: string | null;
  clientName: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  status: SaleStatus;
  itemCount: number;
  createdAt: string;
}

export interface SalesListResponse {
  data: SaleListRowDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SalesFilters {
  status?: SaleStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateSalePayload {
  customerId?: string | null;
  clientName?: string;
  paymentMethod: PaymentMethod;
  items: { productId: string; quantity: number }[];
}

function toQuery(f: SalesFilters) {
  const p = new URLSearchParams();
  if (f.status) p.set("status", f.status);
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.page) p.set("page", String(f.page));
  if (f.pageSize) p.set("pageSize", String(f.pageSize));
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export const salesApi = {
  list: (filters: SalesFilters = {}) => apiFetch<SalesListResponse>(`/sales${toQuery(filters)}`),
  get: (id: string) => apiFetch<{ sale: SaleDetailDTO }>(`/sales/${id}`),
  create: (payload: CreateSalePayload) =>
    apiFetch<{ sale: SaleDetailDTO }>(`/sales`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  cancel: (id: string) =>
    apiFetch<{ sale: SaleDetailDTO }>(`/sales/${id}/cancel`, { method: "POST" }),
  openReceipt: async (id: string) => {
    const token = tokenStore.getAccess();
    const res = await fetch(`${API_URL}/sales/${id}/receipt`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Falha ao gerar cupom");
    const html = await res.text();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank", "noopener");
    if (win) {
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  },
};
