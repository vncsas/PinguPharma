export type TransferStatus = "REQUESTED" | "SENT" | "RECEIVED" | "REJECTED" | "CANCELED";

export interface TransferItem {
  id: string;
  transferId: string;
  productId: string;
  quantity: number;
  batchId: string | null;
  lotNumber: string | null;
  expiresAt: Date | null;
  costPrice: number | null;
}

export interface Transfer {
  id: string;
  fromUnitId: string;
  toUnitId: string;
  status: TransferStatus;
  requestedBy: string;
  sentBy: string | null;
  receivedBy: string | null;
  notes: string | null;
  createdAt: Date;
  sentAt: Date | null;
  receivedAt: Date | null;
}

export interface TransferItemDetail extends TransferItem {
  productName: string;
  productSku: string;
}

export interface TransferDetail extends Transfer {
  fromUnitName: string;
  toUnitName: string;
  requestedByName: string;
  sentByName: string | null;
  receivedByName: string | null;
  items: TransferItemDetail[];
}
