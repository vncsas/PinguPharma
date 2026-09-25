export type SaleStatus = "COMPLETED" | "CANCELED";
export type PaymentMethod = "CASH" | "CREDIT" | "DEBIT" | "PIX" | "OTHER";

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  batchId: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  userId: string;
  customerId: string | null;
  clientName: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  status: SaleStatus;
  createdAt: Date;
  updatedAt: Date;
  items?: SaleItem[];
}
