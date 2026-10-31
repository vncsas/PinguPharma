import type { ConsumptionRow, IReportRepository } from "../../../domain/repositories/IReportRepository.js";

export interface ConsumptionReportInput {
  unitId?: string;
  productId?: string;
  from: Date;
  to: Date;
}

export class GetConsumptionReportUseCase {
  constructor(private readonly reports: IReportRepository) {}

  execute(input: ConsumptionReportInput): Promise<ConsumptionRow[]> {
    return this.reports.consumption(input);
  }
}
