import type { Batch } from "../entities/Batch.js";
import type { BatchEntryType } from "../entities/StockMovement.js";

export interface CreateBatchData {
  unitId: string;
  productId: string;
  lotNumber: string;
  quantity: number;
  costPrice: number;
  expiresAt: Date;
  supplierId?: string | null;
  /** Nota fiscal / empenho. */
  document?: string | null;
  entryType: BatchEntryType;
  /** Usuário que registra a entrada (grava o StockMovement). */
  userId: string;
  reason?: string | null;
}

export interface BatchListItem extends Batch {
  productName: string;
  productSku: string;
  unitName: string;
  supplierName: string | null;
}

export interface ListBatchesQuery {
  unitId?: string;
  productId?: string;
  expiringWithinDays?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginatedBatches {
  data: BatchListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IBatchRepository {
  /** Transacional: cria o lote e grava o movimento ENTRY_* (quantidade positiva). */
  create(data: CreateBatchData): Promise<Batch>;
  list(query: ListBatchesQuery): Promise<PaginatedBatches>;
  findById(id: string): Promise<Batch | null>;
  /** Transacional: se houver saldo, grava ADJUSTMENT negativo antes de excluir. */
  delete(id: string, userId: string): Promise<void>;
  findExpiringSoon(days: number, unitId?: string): Promise<BatchListItem[]>;
  findExpired(unitId?: string): Promise<BatchListItem[]>;
}
