import type { IProductRepository } from "../../../domain/repositories/IProductRepository.js";
import { NotFoundError } from "../../../shared/errors/AppError.js";

export class DeleteProductUseCase {
  constructor(private readonly products: IProductRepository) {}

  async execute(id: string): Promise<void> {
    const p = await this.products.findById(id);
    if (!p) throw new NotFoundError("Product");
    await this.products.delete(id);
  }
}
