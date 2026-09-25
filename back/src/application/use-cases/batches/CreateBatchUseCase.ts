import type { CreateBatchData, IBatchRepository } from "../../../domain/repositories/IBatchRepository.js";
import type { IProductRepository } from "../../../domain/repositories/IProductRepository.js";
import type { Batch } from "../../../domain/entities/Batch.js";
import { NotFoundError, ValidationError } from "../../../shared/errors/AppError.js";

export class CreateBatchUseCase {
  constructor(
    private readonly batches: IBatchRepository,
    private readonly products: IProductRepository,
  ) {}

  async execute(data: CreateBatchData): Promise<Batch> {
    if (data.quantity <= 0) throw new ValidationError("Quantidade deve ser > 0");
    if (data.costPrice < 0) throw new ValidationError("Custo inválido");
    if (data.expiresAt.getTime() < Date.now()) {
      throw new ValidationError("Validade deve estar no futuro");
    }
    const product = await this.products.findById(data.productId);
    if (!product) throw new NotFoundError("Product");
    return this.batches.create(data);
  }
}
