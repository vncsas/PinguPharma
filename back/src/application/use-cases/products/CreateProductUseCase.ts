import type {
  CreateProductData,
  IProductRepository,
} from "../../../domain/repositories/IProductRepository.js";
import type { Product } from "../../../domain/entities/Product.js";
import { ConflictError } from "../../../shared/errors/AppError.js";

export class CreateProductUseCase {
  constructor(private readonly products: IProductRepository) {}

  async execute(data: CreateProductData): Promise<Product> {
    const existing = await this.products.findBySku(data.sku);
    if (existing) throw new ConflictError(`SKU '${data.sku}' already exists`);
    return this.products.create(data);
  }
}
