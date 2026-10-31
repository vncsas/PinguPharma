import type { IProductRepository } from "../../../domain/repositories/IProductRepository.js";
import type { IDispensationRepository } from "../../../domain/repositories/IDispensationRepository.js";
import type { IBatchRepository } from "../../../domain/repositories/IBatchRepository.js";
import type { ITransferRepository } from "../../../domain/repositories/ITransferRepository.js";
import type { IReportRepository } from "../../../domain/repositories/IReportRepository.js";

export interface DashboardMetrics {
  today: { dispensationsCount: number };
  dispensationsLast7Days: { date: string; count: number }[];
  latestDispensations: {
    id: string;
    createdAt: Date;
    userName: string;
    patientName: string | null;
    status: string;
  }[];
  lowStockCount: number;
  expiringSoonCount: number;
  pendingTransfers: number;
  criticalStockCount: number;
  expiredBatchesCount: number;
  lossesLast30Days: { quantity: number; totalValue: number };
  topConsumed: { productId: string; productName: string; productSku: string; quantity: number }[];
}

export class GetDashboardMetricsUseCase {
  constructor(
    private readonly dispensations: IDispensationRepository,
    private readonly products: IProductRepository,
    private readonly batches: IBatchRepository,
    private readonly transfers: ITransferRepository,
    private readonly reports: IReportRepository,
  ) {}

  async execute(unitId?: string): Promise<DashboardMetrics> {
    const now = new Date();
    const from = new Date();
    from.setDate(now.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    const from30 = new Date(now.getTime() - 30 * 86_400_000);

    const [today, series, latest, lowStock, expiring, pending, coverage, expired, losses, consumption] = await Promise.all([
      this.dispensations.countToday(unitId),
      this.dispensations.countBetween(from, now, unitId),
      this.dispensations.latest(5, unitId),
      this.products.countLowStock(unitId),
      this.products.countExpiringSoon(30, unitId),
      this.transfers.countPending(unitId),
      this.reports.stockCoverage({ unitId }),
      this.batches.findExpired(unitId),
      this.reports.losses({ unitId, from: from30, to: now }),
      this.reports.consumption({ unitId, from: from30, to: now }),
    ]);

    const byProduct = new Map<string, { productId: string; productName: string; productSku: string; quantity: number }>();
    for (const r of consumption) {
      const e = byProduct.get(r.productId) ?? {
        productId: r.productId,
        productName: r.productName,
        productSku: r.productSku,
        quantity: 0,
      };
      e.quantity += r.quantity;
      byProduct.set(r.productId, e);
    }

    return {
      today: { dispensationsCount: today.count },
      dispensationsLast7Days: series.map((p) => ({ date: p.date, count: p.count })),
      latestDispensations: latest.map((d) => ({
        id: d.id,
        createdAt: d.createdAt,
        userName: d.userName,
        patientName: d.patientName,
        status: d.status,
      })),
      lowStockCount: lowStock,
      expiringSoonCount: expiring,
      pendingTransfers: pending,
      criticalStockCount: coverage.filter((r) => r.status === "CRITICAL" || (r.status === "RUPTURE" && r.avgDailyConsumption > 0)).length,
      expiredBatchesCount: expired.length,
      lossesLast30Days: { quantity: losses.totalQuantity, totalValue: losses.totalValue },
      topConsumed: [...byProduct.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    };
  }
}
