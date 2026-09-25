export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  price: number;
  minStockAlert: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithStock extends Product {
  totalStock: number;
  nearestExpiration: Date | null;
  batchCount: number;
}
