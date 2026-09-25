import type { PaymentMethod, Sale, SaleStatus } from "../entities/Sale.js";

export interface DailyRevenuePoint {
  date: string;
  total: number;
  count: number;
}

export interface ListSalesQuery {
  status?: SaleStatus;
  from?: Date;
  to?: Date;
  userId?: string;
  page?: number;
  pageSize?: number;
}

export interface SaleListRow extends Sale {
  userName: string;
  customerName: string | null;
  itemCount: number;
}

export interface PaginatedSales {
  data: SaleListRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SaleItemDetail {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  batchId: string | null;
  lotNumber: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleDetail extends Sale {
  userName: string;
  customerName: string | null;
  items: SaleItemDetail[];
}

export interface CreateSaleData {
  userId: string;
  customerId?: string | null;
  clientName?: string;
  paymentMethod: PaymentMethod;
  items: { productId: string; quantity: number }[];
}

export interface ISaleRepository {
  findById(id: string): Promise<Sale | null>;
  findDetail(id: string): Promise<SaleDetail | null>;
  list(query: ListSalesQuery): Promise<PaginatedSales>;
  latest(limit: number): Promise<(Sale & { userName: string })[]>;
  revenueBetween(from: Date, to: Date): Promise<DailyRevenuePoint[]>;
  countToday(): Promise<{ count: number; total: number }>;
  create(data: CreateSaleData): Promise<SaleDetail>;
  cancel(id: string): Promise<SaleDetail>;
}
