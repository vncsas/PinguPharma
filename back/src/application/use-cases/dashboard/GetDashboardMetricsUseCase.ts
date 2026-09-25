import type { IProductRepository } from "../../../domain/repositories/IProductRepository.js";
import type { ISaleRepository } from "../../../domain/repositories/ISaleRepository.js";

export interface DashboardMetrics {
  today: { revenue: number; salesCount: number };
  revenueLast7Days: { date: string; total: number; count: number }[];
  latestSales: {
    id: string;
    createdAt: Date;
    totalAmount: number;
    userName: string;
    clientName: string;
    status: string;
  }[];
  lowStockCount: number;
  expiringSoonCount: number;
}

export class GetDashboardMetricsUseCase {
  constructor(
    private readonly sales: ISaleRepository,
    private readonly products: IProductRepository,
  ) {}

  async execute(): Promise<DashboardMetrics> {
    const now = new Date();
    const from = new Date();
    from.setDate(now.getDate() - 6);
    from.setHours(0, 0, 0, 0);

    const [today, series, latest, lowStock, expiring] = await Promise.all([
      this.sales.countToday(),
      this.sales.revenueBetween(from, now),
      this.sales.latest(5),
      this.products.countLowStock(),
      this.products.countExpiringSoon(30),
    ]);

    return {
      today: { revenue: today.total, salesCount: today.count },
      revenueLast7Days: series,
      latestSales: latest.map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        totalAmount: s.totalAmount,
        userName: s.userName,
        clientName: s.clientName,
        status: s.status,
      })),
      lowStockCount: lowStock,
      expiringSoonCount: expiring,
    };
  }
}
