import type { ControlledClass } from "../entities/Product.js";
import type { StockMovementType } from "../entities/StockMovement.js";

export interface ConsumptionRow {
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

export interface StockCoverageRow {
  productId: string;
  productName: string;
  productSku: string;
  unitId: string;
  unitName: string;
  currentStock: number;
  minStockAlert: number;
  /** Consumo líquido (dispensações - cancelamentos) dos últimos 30 dias / 30. */
  avgDailyConsumption: number;
  /** currentStock / avgDailyConsumption; null se não houve consumo. */
  coverageDays: number | null;
  /** RUPTURE: estoque 0; CRITICAL: cobertura <= 7; LOW: <= minStockAlert ou cobertura <= 15; OK. */
  status: CoverageStatus;
}

export interface LossRow {
  movementId: string;
  createdAt: Date;
  unitId: string;
  unitName: string;
  productId: string;
  productName: string;
  lotNumber: string | null;
  type: Extract<StockMovementType, "LOSS_EXPIRED" | "LOSS_DAMAGE">;
  quantity: number;
  value: number;
  reason: string | null;
  document: string | null;
  userName: string;
}

export interface LossReport {
  rows: LossRow[];
  totalQuantity: number;
  totalValue: number;
  byType: { type: string; quantity: number; value: number }[];
}

export interface DispensationSummaryRow {
  key: string;
  label: string;
  dispensationCount: number;
  itemQuantity: number;
  totalValue: number;
}

export interface ControlledLedgerEntry {
  movementId: string;
  createdAt: Date;
  type: StockMovementType;
  quantity: number;
  /** Saldo (do produto na unidade, ou em todas) após o movimento. */
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

export interface ControlledLedger {
  productId: string;
  productName: string;
  controlledClass: ControlledClass;
  openingBalance: number;
  closingBalance: number;
  entries: ControlledLedgerEntry[];
}

export interface ControlledBalanceRow {
  productId: string;
  productName: string;
  controlledClass: ControlledClass;
  unitId: string;
  unitName: string;
  /** Soma dos lotes. */
  batchTotal: number;
  /** Soma dos movimentos (livro). */
  ledgerTotal: number;
  /** batchTotal - ledgerTotal; diferente de 0 indica divergência. */
  divergence: number;
  batches: { batchId: string; lotNumber: string; expiresAt: Date; quantity: number }[];
}

export interface IReportRepository {
  consumption(params: { unitId?: string; productId?: string; from: Date; to: Date }): Promise<ConsumptionRow[]>;
  /** Uma linha por (unidade, produto ativo) com estoque, consumo ou alerta mínimo; ordenado por cobertura crescente. */
  stockCoverage(params: { unitId?: string; productId?: string }): Promise<StockCoverageRow[]>;
  losses(params: { unitId?: string; from: Date; to: Date }): Promise<LossReport>;
  dispensationSummary(params: {
    unitId?: string;
    from: Date;
    to: Date;
    groupBy: "patient" | "prescriber";
  }): Promise<DispensationSummaryRow[]>;
  controlledLedger(params: { productId: string; unitId?: string; from?: Date; to?: Date }): Promise<ControlledLedger | null>;
  controlledBalance(params: { unitId?: string }): Promise<ControlledBalanceRow[]>;
}
