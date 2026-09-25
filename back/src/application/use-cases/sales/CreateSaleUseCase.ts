import type {
  CreateSaleData,
  ISaleRepository,
  SaleDetail,
} from "../../../domain/repositories/ISaleRepository.js";

export class CreateSaleUseCase {
  constructor(private readonly sales: ISaleRepository) {}

  execute(data: CreateSaleData): Promise<SaleDetail> {
    return this.sales.create(data);
  }
}
