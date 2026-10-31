import type { PrismaClient, Prisma } from "@prisma/client";
import type {
  CreateUnitData,
  IUnitRepository,
  UpdateUnitData,
} from "../../../domain/repositories/IUnitRepository.js";
import type { Unit, UnitType } from "../../../domain/entities/Unit.js";

function toUnit(row: Prisma.UnitGetPayload<object>): Unit {
  return { ...row, type: row.type as UnitType };
}

export class PrismaUnitRepository implements IUnitRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(params: { search?: string; activeOnly?: boolean } = {}): Promise<Unit[]> {
    const rows = await this.prisma.unit.findMany({
      where: {
        AND: [
          params.activeOnly ? { active: true } : {},
          params.search
            ? { OR: [{ name: { contains: params.search } }, { cnes: { contains: params.search } }] }
            : {},
        ],
      },
      orderBy: { name: "asc" },
    });
    return rows.map(toUnit);
  }

  async findById(id: string): Promise<Unit | null> {
    const u = await this.prisma.unit.findUnique({ where: { id } });
    return u ? toUnit(u) : null;
  }

  async create(data: CreateUnitData): Promise<Unit> {
    const u = await this.prisma.unit.create({
      data: { name: data.name, cnes: data.cnes ?? null, type: data.type, active: data.active ?? true },
    });
    return toUnit(u);
  }

  async update(id: string, data: UpdateUnitData): Promise<Unit> {
    const u = await this.prisma.unit.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.cnes !== undefined ? { cnes: data.cnes } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
    });
    return toUnit(u);
  }
}
