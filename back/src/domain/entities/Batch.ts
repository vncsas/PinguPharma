export interface Batch {
  id: string;
  productId: string;
  lotNumber: string;
  quantity: number;
  costPrice: number;
  expiresAt: Date;
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
