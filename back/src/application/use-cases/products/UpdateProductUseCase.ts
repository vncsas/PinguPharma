import type {
  IProductRepository,
  UpdateProductData,
} from "../../../domain/repositories/IProductRepository.js";
import type { Product } from "../../../domain/entities/Product.js";
import type { UserRole } from "../../../domain/entities/User.js";
import { ConflictError, ForbiddenError, NotFoundError } from "../../../shared/errors/AppError.js";

export class UpdateProductUseCase {
  constructor(private readonly products: IProductRepository) {}

  async execute(id: string, data: UpdateProductData, actorRole: UserRole): Promise<Product> {
    const existing = await this.products.findById(id);
    if (!existing) throw new NotFoundError("Product");
    const touchesControlled =
      existing.controlledClass !== "NONE" ||
      (data.controlledClass !== undefined && data.controlledClass !== existing.controlledClass);
    if (touchesControlled && actorRole !== "ADMIN") {
      throw new ForbiddenError("Somente administrador pode alterar medicamento controlado ou sua classe");
    }
    if (data.sku && data.sku !== existing.sku) {
      const bySku = await this.products.findBySku(data.sku);
      if (bySku) throw new ConflictError(`SKU '${data.sku}' já cadastrado`);
    }
    return this.products.update(id, data);
  }
}
