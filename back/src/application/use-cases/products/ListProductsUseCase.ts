import type {
  IProductRepository,
  ListProductsQuery,
  PaginatedProducts,
} from "../../../domain/repositories/IProductRepository.js";

export class ListProductsUseCase {
  constructor(private readonly products: IProductRepository) {}

  execute(query: ListProductsQuery): Promise<PaginatedProducts> {
    return this.products.list(query);
  }
}
