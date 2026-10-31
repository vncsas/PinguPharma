import { apiFetch } from "@/lib/api-client";

export type StockMovementType =
  | "ENTRY_PURCHASE"
  | "ENTRY_DONATION"
  | "ENTRY_TRANSFER"
  | "DISPENSATION"
  | "DISPENSATION_CANCEL"
  | "LOSS_EXPIRED"
  | "LOSS_DAMAGE"
  | "ADJUSTMENT"
  | "TRANSFER_OUT";

export const MOVEMENT_LABEL: Record<StockMovementType, string> = {
  ENTRY_PURCHASE: "Entrada (compra/licitação)",
  ENTRY_DONATION: "Entrada (doação)",
  ENTRY_TRANSFER: "Entrada (transferência)",
  DISPENSATION: "Dispensação",
  DISPENSATION_CANCEL: "Estorno de dispensação",
  LOSS_EXPIRED: "Perda por vencimento",
  LOSS_DAMAGE: "Perda por avaria",
  ADJUSTMENT: "Ajuste de inventário",
  TRANSFER_OUT: "Saída (transferência)",
};

export interface StockMovementDTO {
  id: string;
  unitId: string;
  unitName: string;
  productId: string;
  productName: string;
  productSku: string;
  batchId: string | null;
  lotNumber: string | null;
  type: StockMovementType;
  /** Com sinal: entradas positivas, saídas negativas. */
  quantity: number;
  reason: string | null;
  document: string | null;
  supplierId: string | null;
  supplierName: string | null;
  refType: string | null;
  refId: string | null;
  userId: string;
  userName: string;
  balance: number;
  createdAt: string;
}

export interface StockMovementsResponse {
  data: StockMovementDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MovementFilters {
  productId?: string;
  type?: StockMovementType;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface LossInput {
  batchId: string;
  quantity: number;
  type: "LOSS_EXPIRED" | "LOSS_DAMAGE";
  reason: string;
  document?: string | null;
}

export interface AdjustmentInput {
  batchId: string;
  newQuantity: number;
  reason: string;
}

function toQuery(f: MovementFilters) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  });
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export const stockApi = {
  movements: (f: MovementFilters = {}) =>
    apiFetch<StockMovementsResponse>(`/stock-movements${toQuery(f)}`),
  registerLoss: (data: LossInput) =>
    apiFetch<{ movement: StockMovementDTO }>("/stock/losses", { method: "POST", body: JSON.stringify(data) }),
  registerAdjustment: (data: AdjustmentInput) =>
    apiFetch<{ movement: StockMovementDTO }>("/stock/adjustments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
