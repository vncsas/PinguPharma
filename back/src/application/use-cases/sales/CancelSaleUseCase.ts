import type { ISaleRepository, SaleDetail } from "../../../domain/repositories/ISaleRepository.js";

export class CancelSaleUseCase {
  constructor(private readonly sales: ISaleRepository) {}

  execute(id: string): Promise<SaleDetail> {
    return this.sales.cancel(id);
  }
}
