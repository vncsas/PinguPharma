import type { StockMovementRow, StockMovementType } from "../entities/StockMovement.js";

export interface ListStockMovementsQuery {
  unitId?: string;
  productId?: string;
  batchId?: string;
  type?: StockMovementType;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}

export interface PaginatedStockMovements {
  data: StockMovementRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RegisterLossData {
  batchId: string;
  quantity: number;
  type: "LOSS_EXPIRED" | "LOSS_DAMAGE";
  reason: string;
  document?: string | null;
  userId: string;
}

export interface RegisterAdjustmentData {
  batchId: string;
  /** Novo saldo do lote; o movimento grava a diferença. */
  newQuantity: number;
  reason: string;
  userId: string;
}

export interface IStockMovementRepository {
  /** Mais recentes primeiro; `balance` é o saldo corrente do produto (independente dos filtros de tipo/período). */
  list(query: ListStockMovementsQuery): Promise<PaginatedStockMovements>;
  /** Transacional: baixa o lote e grava LOSS_*. Lança ConflictError se quantity > saldo do lote. */
  registerLoss(data: RegisterLossData): Promise<StockMovementRow>;
  /** Transacional: ajusta o lote e grava ADJUSTMENT com a diferença. */
  registerAdjustment(data: RegisterAdjustmentData): Promise<StockMovementRow>;
}
