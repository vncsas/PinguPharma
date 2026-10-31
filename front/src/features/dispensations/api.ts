import { apiFetch, tokenStore, unitStore } from "@/lib/api-client";
import type { ControlledClass } from "@/features/products/api";

const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

export type DispensationStatus = "COMPLETED" | "CANCELED";

export interface DispensationItemDTO {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  presentation: string | null;
  measureUnit: string | null;
  controlledClass: ControlledClass;
  batchId: string | null;
  lotNumber: string | null;
  expiresAt: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface DispensationDetailDTO {
  id: string;
  unitId: string;
  unitName: string;
  userId: string;
  userName: string;
  pharmacistId: string | null;
  pharmacistName: string | null;
  patientId: string | null;
  patientName: string | null;
  patientCpf: string | null;
  patientCns: string | null;
  prescriptionId: string | null;
  prescription: {
    id: string;
    number: string | null;
    prescriberName: string;
    prescriberCouncil: string;
    prescriberCouncilNumber: string;
    issuedAt: string;
    validUntil: string;
  } | null;
  totalValue: number;
  status: DispensationStatus;
  cancelReason: string | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: DispensationItemDTO[];
}

export interface DispensationListRowDTO {
  id: string;
  unitId: string;
  unitName: string;
  userId: string;
  userName: string;
  patientId: string | null;
  patientName: string | null;
  prescriptionId: string | null;
  totalValue: number;
  status: DispensationStatus;
  cancelReason: string | null;
  itemCount: number;
  createdAt: string;
}

export interface DispensationListResponse {
  data: DispensationListRowDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DispensationFilters {
  status?: DispensationStatus;
  from?: string;
  to?: string;
  patientId?: string;
  prescriptionId?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateDispensationPayload {
  patientId?: string | null;
  prescriptionId?: string | null;
  items: { productId: string; quantity: number }[];
}

function toQuery(f: DispensationFilters) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  });
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export const dispensationsApi = {
  list: (f: DispensationFilters = {}) =>
    apiFetch<DispensationListResponse>(`/dispensations${toQuery(f)}`),
  get: (id: string) => apiFetch<{ dispensation: DispensationDetailDTO }>(`/dispensations/${id}`),
  create: (payload: CreateDispensationPayload) =>
    apiFetch<{ dispensation: DispensationDetailDTO }>("/dispensations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  cancel: (id: string, reason: string) =>
    apiFetch<{ dispensation: DispensationDetailDTO }>(`/dispensations/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  openReceipt: async (id: string) => {
    const token = tokenStore.getAccess();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const unitId = unitStore.get();
    if (unitId) headers["X-Unit-Id"] = unitId;
    const res = await fetch(`${API_URL}/dispensations/${id}/receipt`, { headers });
    if (!res.ok) throw new Error("Falha ao gerar o comprovante");
    const html = await res.text();
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const win = window.open(url, "_blank", "noopener");
    if (win) setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};
