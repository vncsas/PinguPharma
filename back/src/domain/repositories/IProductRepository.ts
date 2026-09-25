import type { Product, ProductWithStock } from "../entities/Product.js";

export interface CreateProductData {
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  minStockAlert?: number;
}

export interface UpdateProductData {
  name?: string;
  sku?: string;
  description?: string | null;
  price?: number;
  minStockAlert?: number;
  active?: boolean;
}

export interface ListProductsQuery {
  search?: string;
  active?: boolean;
  lowStockOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedProducts {
  data: ProductWithStock[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IProductRepository {
  findById(id: string): Promise<ProductWithStock | null>;
  findBySku(sku: string): Promise<Product | null>;
  list(query: ListProductsQuery): Promise<PaginatedProducts>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: UpdateProductData): Promise<Product>;
  delete(id: string): Promise<void>;
  countLowStock(): Promise<number>;
  countExpiringSoon(days: number): Promise<number>;
}
