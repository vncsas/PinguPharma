import { apiFetch } from "@/lib/api-client";
import type { ControlledClass } from "@/features/products/api";
import type { StockMovementType } from "@/features/stock/api";

export interface LedgerEntryDTO {
  movementId: string;
  createdAt: string;
  type: StockMovementType;
  quantity: number;
  balance: number;
  unitName: string;
  lotNumber: string | null;
  reason: string | null;
  document: string | null;
  userName: string;
  dispensationId: string | null;
  patientName: string | null;
  patientCpf: string | null;
  patientCns: string | null;
  prescriptionNumber: string | null;
  prescriberName: string | null;
  prescriberCouncil: string | null;
  prescriberCouncilNumber: string | null;
  pharmacistName: string | null;
}

export interface LedgerDTO {
  productId: string;
  productName: string;
  controlledClass: ControlledClass;
  openingBalance: number;
  closingBalance: number;
  entries: LedgerEntryDTO[];
}

export interface ControlledBalanceRowDTO {
  productId: string;
  productName: string;
  controlledClass: ControlledClass;
  unitId: string;
  unitName: string;
  batchTotal: number;
  ledgerTotal: number;
  divergence: number;
  batches: { batchId: string; lotNumber: string; expiresAt: string; quantity: number }[];
}

function qs(params: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const controlledApi = {
  ledger: (productId: string, from?: string, to?: string) =>
    apiFetch<{ ledger: LedgerDTO }>(`/controlled/ledger${qs({ productId, from, to })}`),
  ledgerCsvPath: (productId: string, from?: string, to?: string) =>
    `/controlled/ledger.csv${qs({ productId, from, to })}`,
  balance: () => apiFetch<{ rows: ControlledBalanceRowDTO[] }>("/controlled/balance"),
  balanceCsvPath: () => "/controlled/balance.csv",
};
