import type { IProductRepository } from "../../../domain/repositories/IProductRepository.js";
import { NotFoundError } from "../../../shared/errors/AppError.js";
import type { ProductWithStock } from "../../../domain/entities/Product.js";

export class GetProductUseCase {
  constructor(private readonly products: IProductRepository) {}

  async execute(id: string, unitId?: string): Promise<ProductWithStock> {
    const p = await this.products.findById(id, unitId);
    if (!p) throw new NotFoundError("Product");
    return p;
  }
}
