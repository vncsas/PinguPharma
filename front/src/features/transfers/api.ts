import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export type TransferStatus = "REQUESTED" | "SENT" | "RECEIVED" | "REJECTED" | "CANCELED";

export const TRANSFER_STATUS_LABEL: Record<TransferStatus, string> = {
  REQUESTED: "Solicitada",
  SENT: "Enviada",
  RECEIVED: "Recebida",
  REJECTED: "Recusada",
  CANCELED: "Cancelada",
};

export interface TransferItemDTO {
  id: string;
  transferId: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  batchId: string | null;
  lotNumber: string | null;
  expiresAt: string | null;
  costPrice: number | null;
}

export interface TransferDTO {
  id: string;
  fromUnitId: string;
  toUnitId: string;
  fromUnitName: string;
  toUnitName: string;
  status: TransferStatus;
  requestedBy: string;
  requestedByName: string;
  sentBy: string | null;
  sentByName: string | null;
  receivedBy: string | null;
  receivedByName: string | null;
  notes: string | null;
  createdAt: string;
  sentAt: string | null;
  receivedAt: string | null;
  items: TransferItemDTO[];
}

export interface TransfersResponse {
  data: TransferDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TransferFilters {
  direction?: "in" | "out";
  status?: TransferStatus;
  page?: number;
  pageSize?: number;
}

export interface RequestTransferPayload {
  fromUnitId: string;
  notes?: string | null;
  items: { productId: string; quantity: number }[];
}

export const transfersApi = {
  list: (f: TransferFilters = {}) => {
    const p = new URLSearchParams();
    if (f.direction) p.set("direction", f.direction);
    if (f.status) p.set("status", f.status);
    if (f.page) p.set("page", String(f.page));
    if (f.pageSize) p.set("pageSize", String(f.pageSize));
    const s = p.toString();
    return apiFetch<TransfersResponse>(`/transfers${s ? `?${s}` : ""}`);
  },
  get: (id: string) => apiFetch<{ transfer: TransferDTO }>(`/transfers/${id}`),
  request: (data: RequestTransferPayload) =>
    apiFetch<{ transfer: TransferDTO }>("/transfers", { method: "POST", body: JSON.stringify(data) }),
  send: (id: string) => apiFetch<{ transfer: TransferDTO }>(`/transfers/${id}/send`, { method: "POST" }),
  receive: (id: string) => apiFetch<{ transfer: TransferDTO }>(`/transfers/${id}/receive`, { method: "POST" }),
  reject: (id: string, reason: string) =>
    apiFetch<{ transfer: TransferDTO }>(`/transfers/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  cancel: (id: string, reason: string) =>
    apiFetch<{ transfer: TransferDTO }>(`/transfers/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

export type TransferAction = "send" | "receive" | "reject" | "cancel";

export function useTransferAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: TransferAction; reason?: string }) => {
      if (action === "send") return transfersApi.send(id);
      if (action === "receive") return transfersApi.receive(id);
      if (action === "reject") return transfersApi.reject(id, reason ?? "");
      return transfersApi.cancel(id, reason ?? "");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["batches"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useRequestTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: transfersApi.request,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}
