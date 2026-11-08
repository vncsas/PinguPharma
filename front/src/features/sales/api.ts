import { apiBlob, apiFetch, openBlob } from "@/lib/api-client";

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
    const html = await apiBlob(`/sales/${id}/receipt`);
    openBlob(new Blob([html], { type: "text/html" }));
  },
};
