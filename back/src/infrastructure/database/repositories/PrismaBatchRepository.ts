import type { PrismaClient, Prisma } from "@prisma/client";
import type {
  BatchListItem,
  CreateBatchData,
  IBatchRepository,
  ListBatchesQuery,
  PaginatedBatches,
} from "../../../domain/repositories/IBatchRepository.js";
import type { Batch } from "../../../domain/entities/Batch.js";

function toBatch(row: Prisma.BatchGetPayload<{}>): Batch {
  return {
    id: row.id,
    productId: row.productId,
    lotNumber: row.lotNumber,
    quantity: row.quantity,
    costPrice: Number(row.costPrice),
    expiresAt: row.expiresAt,
    receivedAt: row.receivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toItem(
  row: Prisma.BatchGetPayload<{ include: { product: { select: { name: true; sku: true } } } }>,
): BatchListItem {
  return {
    ...toBatch(row),
    productName: row.product.name,
    productSku: row.product.sku,
  };
}

export class PrismaBatchRepository implements IBatchRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateBatchData): Promise<Batch> {
    const b = await this.prisma.batch.create({ data });
    return toBatch(b);
  }

  async findById(id: string): Promise<Batch | null> {
    const b = await this.prisma.batch.findUnique({ where: { id } });
    return b ? toBatch(b) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.batch.delete({ where: { id } });
  }

  async list(query: ListBatchesQuery): Promise<PaginatedBatches> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.BatchWhereInput = {
      AND: [
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
        include: { product: { select: { name: true, sku: true } } },
        orderBy: [{ expiresAt: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.batch.count({ where }),
    ]);
    return { data: rows.map(toItem), total, page, pageSize };
  }

  async findExpiringSoon(days: number): Promise<BatchListItem[]> {
    const rows = await this.prisma.batch.findMany({
      where: {
        quantity: { gt: 0 },
        expiresAt: { lte: this.dateInDays(days) },
      },
      include: { product: { select: { name: true, sku: true } } },
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
