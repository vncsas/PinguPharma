import type {
  ControlledBalanceRow,
  ControlledLedger,
  DispensationSummaryRow,
  IReportRepository,
  LossReport,
  StockCoverageRow,
} from "../../../domain/repositories/IReportRepository.js";
import { NotFoundError } from "../../../shared/errors/AppError.js";
import { maskCns, maskCpf } from "../../../shared/utils/documents.js";

export class GetStockCoverageReportUseCase {
  constructor(private readonly reports: IReportRepository) {}

  async execute(input: { unitId?: string; productId?: string }): Promise<StockCoverageRow[]> {
    const rows = await this.reports.stockCoverage(input);
    return rows.map((r) => ({ ...r, coverageDays: r.coverageDays === null ? null : Math.round(r.coverageDays * 10) / 10 }));
  }
}

export class GetLossesReportUseCase {
  constructor(private readonly reports: IReportRepository) {}

  async execute(input: { unitId?: string; productId?: string; from: Date; to: Date }): Promise<LossReport> {
    const report = await this.reports.losses({ unitId: input.unitId, from: input.from, to: input.to });
    if (!input.productId) return report;
    const rows = report.rows.filter((r) => r.productId === input.productId);
    const byType = new Map<string, { type: string; quantity: number; value: number }>();
    for (const r of rows) {
      const b = byType.get(r.type) ?? { type: r.type, quantity: 0, value: 0 };
      b.quantity += r.quantity;
      b.value += r.value;
      byType.set(r.type, b);
    }
    return {
      rows,
      totalQuantity: rows.reduce((a, r) => a + r.quantity, 0),
      totalValue: rows.reduce((a, r) => a + r.value, 0),
      byType: [...byType.values()],
    };
  }
}

export class GetDispensationSummaryReportUseCase {
  constructor(private readonly reports: IReportRepository) {}

  execute(input: { unitId?: string; from: Date; to: Date; groupBy: "patient" | "prescriber" }): Promise<DispensationSummaryRow[]> {
    return this.reports.dispensationSummary(input);
  }
}

export class GetControlledLedgerUseCase {
  constructor(private readonly reports: IReportRepository) {}

  async execute(input: { productId: string; unitId?: string; from?: Date; to?: Date }): Promise<ControlledLedger> {
    const ledger = await this.reports.controlledLedger(input);
    if (!ledger) throw new NotFoundError("Product");
    return {
      ...ledger,
      entries: ledger.entries.map((e) => ({ ...e, patientCpf: maskCpf(e.patientCpf), patientCns: maskCns(e.patientCns) })),
    };
  }
}

export class GetControlledBalanceUseCase {
  constructor(private readonly reports: IReportRepository) {}

  execute(input: { unitId?: string }): Promise<ControlledBalanceRow[]> {
    return this.reports.controlledBalance(input);
  }
}
