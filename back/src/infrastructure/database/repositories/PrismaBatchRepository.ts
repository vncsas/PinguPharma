import type { PrismaClient, Prisma } from "@prisma/client";
import type {
  BatchListItem,
  CreateBatchData,
  IBatchRepository,
  ListBatchesQuery,
  PaginatedBatches,
} from "../../../domain/repositories/IBatchRepository.js";
import type { Batch } from "../../../domain/entities/Batch.js";
import type { BatchEntryType } from "../../../domain/entities/StockMovement.js";
import { ConflictError, NotFoundError } from "../../../shared/errors/AppError.js";
import { recordMovement } from "./stock-helpers.js";

function toBatch(row: Prisma.BatchGetPayload<object>): Batch {
  return {
    id: row.id,
    unitId: row.unitId,
    productId: row.productId,
    supplierId: row.supplierId,
    lotNumber: row.lotNumber,
    quantity: row.quantity,
    costPrice: Number(row.costPrice),
    expiresAt: row.expiresAt,
    document: row.document,
    entryType: row.entryType as BatchEntryType | null,
    receivedAt: row.receivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const itemInclude = {
  product: { select: { name: true, sku: true } },
  unit: { select: { name: true } },
  supplier: { select: { name: true } },
} satisfies Prisma.BatchInclude;

function toItem(row: Prisma.BatchGetPayload<{ include: typeof itemInclude }>): BatchListItem {
  return {
    ...toBatch(row),
    productName: row.product.name,
    productSku: row.product.sku,
    unitName: row.unit.name,
    supplierName: row.supplier?.name ?? null,
  };
}

export class PrismaBatchRepository implements IBatchRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateBatchData): Promise<Batch> {
    return this.prisma.$transaction(async (tx) => {
      const b = await tx.batch.create({
        data: {
          unitId: data.unitId,
          productId: data.productId,
          lotNumber: data.lotNumber,
          quantity: data.quantity,
          costPrice: data.costPrice,
          expiresAt: data.expiresAt,
          supplierId: data.supplierId ?? null,
          document: data.document ?? null,
          entryType: data.entryType,
        },
      });
      await recordMovement(tx, {
        unitId: data.unitId,
        productId: data.productId,
        batchId: b.id,
        type: data.entryType,
        quantity: data.quantity,
        reason: data.reason,
        document: data.document,
        supplierId: data.supplierId,
        refType: "Batch",
        refId: b.id,
        userId: data.userId,
      });
      return toBatch(b);
    });
  }

  async findById(id: string): Promise<Batch | null> {
    const b = await this.prisma.batch.findUnique({ where: { id } });
    return b ? toBatch(b) : null;
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const b = await tx.batch.findUnique({ where: { id } });
      if (!b) throw new NotFoundError("Lote");
      const history = await tx.stockMovement.count({
        where: { batchId: id, NOT: { type: { in: ["ENTRY_PURCHASE", "ENTRY_DONATION", "ENTRY_TRANSFER"] } } },
      });
      const used = await tx.dispensationItem.count({ where: { batchId: id } });
      if (history > 0 || used > 0) {
        throw new ConflictError("Lote possui movimentações (dispensações, perdas ou ajustes) e não pode ser excluído; o histórico deve ser preservado");
      }
      if (b.quantity > 0) {
        await recordMovement(tx, {
          unitId: b.unitId,
          productId: b.productId,
          batchId: b.id,
          type: "ADJUSTMENT",
          quantity: -b.quantity,
          reason: `Exclusão do lote ${b.lotNumber}`,
          refType: "Batch",
          refId: b.id,
          userId,
        });
      }
      await tx.batch.delete({ where: { id } });
    });
  }

  async list(query: ListBatchesQuery): Promise<PaginatedBatches> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.BatchWhereInput = {
      AND: [
        query.unitId ? { unitId: query.unitId } : {},
        query.productId ? { productId: query.productId } : {},
        query.expiringWithinDays !== undefined
          ? {
              expiresAt: { lte: this.dateInDays(query.expiringWithinDays) },
              quantity: { gt: 0 },
            }
          : {},
      ],
    };
    const [rows, total] = await Promise.all([
      this.prisma.batch.findMany({
        where,
        include: itemInclude,
        orderBy: [{ expiresAt: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.batch.count({ where }),
    ]);
    return { data: rows.map(toItem), total, page, pageSize };
  }

  async findExpiringSoon(days: number, unitId?: string): Promise<BatchListItem[]> {
    const rows = await this.prisma.batch.findMany({
      where: {
        ...(unitId ? { unitId } : {}),
        quantity: { gt: 0 },
        expiresAt: { lte: this.dateInDays(days) },
      },
      include: itemInclude,
      orderBy: [{ expiresAt: "asc" }],
    });
    return rows.map(toItem);
  }

  async findExpired(unitId?: string): Promise<BatchListItem[]> {
    const rows = await this.prisma.batch.findMany({
      where: { ...(unitId ? { unitId } : {}), quantity: { gt: 0 }, expiresAt: { lt: new Date() } },
      include: itemInclude,
      orderBy: [{ expiresAt: "asc" }],
    });
    return rows.map(toItem);
  }

  private dateInDays(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  }
}
