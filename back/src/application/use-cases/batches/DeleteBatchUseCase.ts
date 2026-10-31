import type { IBatchRepository } from "../../../domain/repositories/IBatchRepository.js";
import { ConflictError, NotFoundError } from "../../../shared/errors/AppError.js";

export class DeleteBatchUseCase {
  constructor(private readonly batches: IBatchRepository) {}

  async execute(id: string, userId: string, unitId?: string): Promise<void> {
    const b = await this.batches.findById(id);
    if (!b || (unitId && b.unitId !== unitId)) throw new NotFoundError("Batch");
    if (b.quantity > 0) {
      throw new ConflictError("Lote com estoque não pode ser removido; registre perda ou ajuste antes de excluir");
    }
    await this.batches.delete(id, userId);
  }
}
