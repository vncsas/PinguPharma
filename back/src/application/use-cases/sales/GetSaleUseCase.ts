import type { ISaleRepository, SaleDetail } from "../../../domain/repositories/ISaleRepository.js";
import { NotFoundError } from "../../../shared/errors/AppError.js";

export class GetSaleUseCase {
  constructor(private readonly sales: ISaleRepository) {}

  async execute(id: string): Promise<SaleDetail> {
    const detail = await this.sales.findDetail(id);
    if (!detail) throw new NotFoundError("Sale");
    return detail;
  }
}
