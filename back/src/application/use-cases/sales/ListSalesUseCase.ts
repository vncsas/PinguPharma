import type {
  ISaleRepository,
  ListSalesQuery,
  PaginatedSales,
} from "../../../domain/repositories/ISaleRepository.js";

export class ListSalesUseCase {
  constructor(private readonly sales: ISaleRepository) {}

  execute(query: ListSalesQuery): Promise<PaginatedSales> {
    return this.sales.list(query);
  }
}
