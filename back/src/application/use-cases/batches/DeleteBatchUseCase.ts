import type { IBatchRepository } from "../../../domain/repositories/IBatchRepository.js";
import { ConflictError, NotFoundError } from "../../../shared/errors/AppError.js";

export class DeleteBatchUseCase {
  constructor(private readonly batches: IBatchRepository) {}

  async execute(id: string): Promise<void> {
    const b = await this.batches.findById(id);
    if (!b) throw new NotFoundError("Batch");
    if (b.quantity <= 0) {
      await this.batches.delete(id);
      return;
    }
    throw new ConflictError("Lote com estoque não pode ser removido; ajuste antes de excluir");
  }
}
