import type { Unit, UnitType } from "../entities/Unit.js";

export interface CreateUnitData {
  name: string;
  cnes?: string | null;
  type: UnitType;
  active?: boolean;
}

export interface UpdateUnitData {
  name?: string;
  cnes?: string | null;
  type?: UnitType;
  active?: boolean;
}

export interface IUnitRepository {
  list(params?: { search?: string; activeOnly?: boolean }): Promise<Unit[]>;
  findById(id: string): Promise<Unit | null>;
  create(data: CreateUnitData): Promise<Unit>;
  update(id: string, data: UpdateUnitData): Promise<Unit>;
}
