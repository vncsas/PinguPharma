import type {
  CreateProductData,
  IProductRepository,
} from "../../../domain/repositories/IProductRepository.js";
import type { Product } from "../../../domain/entities/Product.js";
import type { UserRole } from "../../../domain/entities/User.js";
import { ConflictError, ForbiddenError } from "../../../shared/errors/AppError.js";

export class CreateProductUseCase {
  constructor(private readonly products: IProductRepository) {}

  async execute(data: CreateProductData, actorRole: UserRole): Promise<Product> {
    if (data.controlledClass && data.controlledClass !== "NONE" && actorRole !== "ADMIN") {
      throw new ForbiddenError("Somente administrador pode cadastrar medicamento controlado");
    }
    const existing = await this.products.findBySku(data.sku);
    if (existing) throw new ConflictError(`SKU '${data.sku}' já cadastrado`);
    return this.products.create(data);
  }
}
