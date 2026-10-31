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

export type BatchEntryType = "ENTRY_PURCHASE" | "ENTRY_DONATION" | "ENTRY_TRANSFER";

export interface StockMovement {
  id: string;
  unitId: string;
  productId: string;
  batchId: string | null;
  type: StockMovementType;
  /** Com sinal: entradas positivas, saídas negativas. */
  quantity: number;
  reason: string | null;
  document: string | null;
  supplierId: string | null;
  refType: string | null;
  refId: string | null;
  userId: string;
  createdAt: Date;
}

export interface StockMovementRow extends StockMovement {
  unitName: string;
  productName: string;
  productSku: string;
  lotNumber: string | null;
  userName: string;
  supplierName: string | null;
  /** Saldo do produto (na unidade filtrada, ou em todas) logo após este movimento. */
  balance: number;
}
