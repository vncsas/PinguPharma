import type { Batch } from "../entities/Batch.js";

export interface CreateBatchData {
  productId: string;
  lotNumber: string;
  quantity: number;
  costPrice: number;
  expiresAt: Date;
}

export interface BatchListItem extends Batch {
  productName: string;
  productSku: string;
}

export interface ListBatchesQuery {
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
  create(data: CreateBatchData): Promise<Batch>;
  list(query: ListBatchesQuery): Promise<PaginatedBatches>;
  findById(id: string): Promise<Batch | null>;
  delete(id: string): Promise<void>;
  findExpiringSoon(days: number): Promise<BatchListItem[]>;
}
