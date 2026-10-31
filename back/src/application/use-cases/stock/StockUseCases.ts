import type {
  IStockMovementRepository,
  ListStockMovementsQuery,
  PaginatedStockMovements,
  RegisterAdjustmentData,
  RegisterLossData,
} from "../../../domain/repositories/IStockMovementRepository.js";
import type { IBatchRepository } from "../../../domain/repositories/IBatchRepository.js";
import type { StockMovementRow } from "../../../domain/entities/StockMovement.js";
import { NotFoundError, ValidationError } from "../../../shared/errors/AppError.js";

export class ListStockMovementsUseCase {
  constructor(private readonly movements: IStockMovementRepository) {}

  execute(query: ListStockMovementsQuery): Promise<PaginatedStockMovements> {
    return this.movements.list(query);
  }
}

export class RegisterLossUseCase {
  constructor(
    private readonly movements: IStockMovementRepository,
    private readonly batches: IBatchRepository,
  ) {}

  async execute(data: RegisterLossData, unitId?: string): Promise<StockMovementRow> {
    const batch = await this.batches.findById(data.batchId);
    if (!batch || (unitId && batch.unitId !== unitId)) throw new NotFoundError("Lote");
    if (!data.reason.trim()) throw new ValidationError("Informe o motivo da perda");
    return this.movements.registerLoss({ ...data, reason: data.reason.trim() });
  }
}

export class RegisterAdjustmentUseCase {
  constructor(
    private readonly movements: IStockMovementRepository,
    private readonly batches: IBatchRepository,
  ) {}

  async execute(data: RegisterAdjustmentData, unitId?: string): Promise<StockMovementRow> {
    const batch = await this.batches.findById(data.batchId);
    if (!batch || (unitId && batch.unitId !== unitId)) throw new NotFoundError("Lote");
    if (!data.reason.trim()) throw new ValidationError("Informe o motivo do ajuste");
    return this.movements.registerAdjustment({ ...data, reason: data.reason.trim() });
  }
}
