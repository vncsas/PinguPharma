import type { CreateBatchData, IBatchRepository } from "../../../domain/repositories/IBatchRepository.js";
import type { IProductRepository } from "../../../domain/repositories/IProductRepository.js";
import type { ISupplierRepository } from "../../../domain/repositories/ISupplierRepository.js";
import type { IUnitRepository } from "../../../domain/repositories/IUnitRepository.js";
import type { Batch } from "../../../domain/entities/Batch.js";
import { NotFoundError, ValidationError } from "../../../shared/errors/AppError.js";

export class CreateBatchUseCase {
  constructor(
    private readonly batches: IBatchRepository,
    private readonly products: IProductRepository,
    private readonly suppliers: ISupplierRepository,
    private readonly units: IUnitRepository,
  ) {}

  async execute(data: CreateBatchData): Promise<Batch> {
    if (data.entryType === "ENTRY_TRANSFER") {
      throw new ValidationError("Entrada por transferência só é registrada ao receber uma transferência");
    }
    if (data.quantity <= 0) throw new ValidationError("Quantidade deve ser > 0");
    if (data.costPrice < 0) throw new ValidationError("Custo inválido");
    if (data.expiresAt.getTime() < Date.now()) {
      throw new ValidationError("Validade deve estar no futuro");
    }
    const unit = await this.units.findById(data.unitId);
    if (!unit) throw new NotFoundError("Unit");
    const product = await this.products.findById(data.productId);
    if (!product) throw new NotFoundError("Product");
    if (data.supplierId) {
      const supplier = await this.suppliers.findById(data.supplierId);
      if (!supplier) throw new NotFoundError("Supplier");
    }
    return this.batches.create(data);
  }
}
