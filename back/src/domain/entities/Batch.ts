import type { BatchEntryType } from "./StockMovement.js";

export interface Batch {
  id: string;
  unitId: string;
  productId: string;
  supplierId: string | null;
  lotNumber: string;
  quantity: number;
  costPrice: number;
  expiresAt: Date;
  document: string | null;
  entryType: BatchEntryType | null;
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
