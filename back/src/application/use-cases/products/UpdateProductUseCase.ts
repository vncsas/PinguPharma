import type {
  IProductRepository,
  UpdateProductData,
} from "../../../domain/repositories/IProductRepository.js";
import type { Product } from "../../../domain/entities/Product.js";
import { ConflictError, NotFoundError } from "../../../shared/errors/AppError.js";

export class UpdateProductUseCase {
  constructor(private readonly products: IProductRepository) {}

  async execute(id: string, data: UpdateProductData): Promise<Product> {
    const existing = await this.products.findById(id);
    if (!existing) throw new NotFoundError("Product");
    if (data.sku && data.sku !== existing.sku) {
      const bySku = await this.products.findBySku(data.sku);
      if (bySku) throw new ConflictError(`SKU '${data.sku}' already exists`);
    }
    return this.products.update(id, data);
  }
}
