import type { ControlledClass, Product, ProductWithStock } from "../entities/Product.js";

export interface CreateProductData {
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  minStockAlert?: number;
  controlledClass?: ControlledClass;
  activeIngredient?: string | null;
  presentation?: string | null;
  measureUnit?: string | null;
  manufacturer?: string | null;
  renameCode?: string | null;
}

export interface UpdateProductData {
  name?: string;
  sku?: string;
  description?: string | null;
  price?: number;
  minStockAlert?: number;
  active?: boolean;
  controlledClass?: ControlledClass;
  activeIngredient?: string | null;
  presentation?: string | null;
  measureUnit?: string | null;
  manufacturer?: string | null;
  renameCode?: string | null;
}

export interface ListProductsQuery {
  search?: string;
  active?: boolean;
  lowStockOnly?: boolean;
  /** true = só controlados; false = só não controlados. */
  controlled?: boolean;
  /** Estoque (totalStock, lotes, validade) calculado apenas nesta unidade; ausente = todas. */
  unitId?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedProducts {
  data: ProductWithStock[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  unitId?: string;
  unitName?: string;
  totalStock: number;
  minStockAlert: number;
}

export interface IProductRepository {
  findById(id: string, unitId?: string): Promise<ProductWithStock | null>;
  findBySku(sku: string): Promise<Product | null>;
  list(query: ListProductsQuery): Promise<PaginatedProducts>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: UpdateProductData): Promise<Product>;
  delete(id: string): Promise<void>;
  countLowStock(unitId?: string): Promise<number>;
  /** Sem unitId: uma linha por (unidade, produto) abaixo do mínimo; com unitId: apenas da unidade. */
  listLowStock(unitId?: string): Promise<LowStockProduct[]>;
  countExpiringSoon(days: number, unitId?: string): Promise<number>;
}
