import type { PrismaClient, Prisma } from "@prisma/client";
import type {
  CreateSupplierData,
  ISupplierRepository,
  UpdateSupplierData,
} from "../../../domain/repositories/ISupplierRepository.js";
import type { Supplier, SupplierType } from "../../../domain/entities/Supplier.js";

function toSupplier(row: Prisma.SupplierGetPayload<object>): Supplier {
  return { ...row, type: row.type as SupplierType };
}

export class PrismaSupplierRepository implements ISupplierRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(params: { search?: string; activeOnly?: boolean } = {}): Promise<Supplier[]> {
    const rows = await this.prisma.supplier.findMany({
      where: {
        AND: [
          params.activeOnly ? { active: true } : {},
          params.search
            ? { OR: [{ name: { contains: params.search } }, { cnpj: { contains: params.search } }] }
            : {},
        ],
      },
      orderBy: { name: "asc" },
    });
    return rows.map(toSupplier);
  }

  async findById(id: string): Promise<Supplier | null> {
    const s = await this.prisma.supplier.findUnique({ where: { id } });
    return s ? toSupplier(s) : null;
  }

  async findByCnpj(cnpj: string): Promise<Supplier | null> {
    const s = await this.prisma.supplier.findUnique({ where: { cnpj } });
    return s ? toSupplier(s) : null;
  }

  async create(data: CreateSupplierData): Promise<Supplier> {
    const s = await this.prisma.supplier.create({
      data: { name: data.name, cnpj: data.cnpj ?? null, type: data.type, active: data.active ?? true },
    });
    return toSupplier(s);
  }

  async update(id: string, data: UpdateSupplierData): Promise<Supplier> {
    const s = await this.prisma.supplier.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.cnpj !== undefined ? { cnpj: data.cnpj } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
    });
    return toSupplier(s);
  }
}
