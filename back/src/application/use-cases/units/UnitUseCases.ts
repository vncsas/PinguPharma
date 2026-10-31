import type { CreateUnitData, IUnitRepository, UpdateUnitData } from "../../../domain/repositories/IUnitRepository.js";
import type { Unit } from "../../../domain/entities/Unit.js";
import type { UserRole } from "../../../domain/entities/User.js";
import { NotFoundError } from "../../../shared/errors/AppError.js";

export class ListUnitsUseCase {
  constructor(private readonly units: IUnitRepository) {}

  async execute(actor: { role: UserRole; unitId: string | null }, params: { search?: string; activeOnly?: boolean } = {}): Promise<Unit[]> {
    if (actor.role === "ADMIN") return this.units.list(params);
    if (!actor.unitId) return [];
    const own = await this.units.findById(actor.unitId);
    return own ? [own] : [];
  }
}

export class GetUnitUseCase {
  constructor(private readonly units: IUnitRepository) {}

  async execute(id: string): Promise<Unit> {
    const unit = await this.units.findById(id);
    if (!unit) throw new NotFoundError("Unit");
    return unit;
  }
}

export class CreateUnitUseCase {
  constructor(private readonly units: IUnitRepository) {}

  execute(data: CreateUnitData): Promise<Unit> {
    return this.units.create(data);
  }
}

export class UpdateUnitUseCase {
  constructor(private readonly units: IUnitRepository) {}

  async execute(id: string, data: UpdateUnitData): Promise<Unit> {
    const existing = await this.units.findById(id);
    if (!existing) throw new NotFoundError("Unit");
    return this.units.update(id, data);
  }
}
