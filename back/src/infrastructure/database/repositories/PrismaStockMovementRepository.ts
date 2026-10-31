import type { PrismaClient, Prisma } from "@prisma/client";
import type {
  IStockMovementRepository,
  ListStockMovementsQuery,
  PaginatedStockMovements,
  RegisterAdjustmentData,
  RegisterLossData,
} from "../../../domain/repositories/IStockMovementRepository.js";
import type { StockMovementRow, StockMovementType } from "../../../domain/entities/StockMovement.js";
import { AppError, ConflictError, NotFoundError } from "../../../shared/errors/AppError.js";
import { decrementBatch, recordMovement, runningBalances } from "./stock-helpers.js";

const rowInclude = {
  unit: { select: { name: true } },
  product: { select: { name: true, sku: true } },
  batch: { select: { lotNumber: true } },
  user: { select: { name: true } },
  supplier: { select: { name: true } },
} satisfies Prisma.StockMovementInclude;

type RowPayload = Prisma.StockMovementGetPayload<{ include: typeof rowInclude }>;

function toRow(r: RowPayload, balance: number): StockMovementRow {
  return {
    id: r.id,
    unitId: r.unitId,
    productId: r.productId,
    batchId: r.batchId,
    type: r.type as StockMovementType,
    quantity: r.quantity,
    reason: r.reason,
    document: r.document,
    supplierId: r.supplierId,
    refType: r.refType,
    refId: r.refId,
    userId: r.userId,
    createdAt: r.createdAt,
    unitName: r.unit.name,
    productName: r.product.name,
    productSku: r.product.sku,
    lotNumber: r.batch?.lotNumber ?? null,
    userName: r.user.name,
    supplierName: r.supplier?.name ?? null,
    balance,
  };
}

export class PrismaStockMovementRepository implements IStockMovementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(query: ListStockMovementsQuery): Promise<PaginatedStockMovements> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.StockMovementWhereInput = {
      AND: [
        query.unitId ? { unitId: query.unitId } : {},
        query.productId ? { productId: query.productId } : {},
        query.batchId ? { batchId: query.batchId } : {},
        query.type ? { type: query.type } : {},
        query.from || query.to
          ? {
              createdAt: {
                ...(query.from ? { gte: query.from } : {}),
                ...(query.to ? { lte: query.to } : {}),
              },
            }
          : {},
      ],
    };
    const [rows, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: rowInclude,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);
    const balances = await runningBalances(this.prisma, rows, Boolean(query.unitId));
    return { data: rows.map((r) => toRow(r, balances.get(r.id) ?? 0)), total, page, pageSize };
  }

  private async load(db: Prisma.TransactionClient, id: string): Promise<StockMovementRow> {
    const r = await db.stockMovement.findUniqueOrThrow({ where: { id }, include: rowInclude });
    const balances = await runningBalances(db, [r], true);
    return toRow(r, balances.get(r.id) ?? 0);
  }

  async registerLoss(data: RegisterLossData): Promise<StockMovementRow> {
    if (!Number.isInteger(data.quantity) || data.quantity <= 0) {
      throw new AppError("Quantidade deve ser maior que zero", 422);
    }
    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({ where: { id: data.batchId } });
      if (!batch) throw new NotFoundError("Lote");
      if (!(await decrementBatch(tx, batch.id, data.quantity))) {
        throw new ConflictError(`Quantidade maior que o saldo do lote (${batch.quantity})`);
      }
      const m = await recordMovement(tx, {
        unitId: batch.unitId,
        productId: batch.productId,
        batchId: batch.id,
        type: data.type,
        quantity: -data.quantity,
        reason: data.reason,
        document: data.document,
        refType: "Batch",
        refId: batch.id,
        userId: data.userId,
      });
      return this.load(tx, m.id);
    });
  }

  async registerAdjustment(data: RegisterAdjustmentData): Promise<StockMovementRow> {
    if (!Number.isInteger(data.newQuantity) || data.newQuantity < 0) {
      throw new AppError("Novo saldo inválido", 422);
    }
    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({ where: { id: data.batchId } });
      if (!batch) throw new NotFoundError("Lote");
      const diff = data.newQuantity - batch.quantity;
      if (diff === 0) throw new ConflictError("O novo saldo é igual ao saldo atual do lote");
      const res = await tx.batch.updateMany({
        where: { id: batch.id, quantity: batch.quantity },
        data: { quantity: data.newQuantity },
      });
      if (res.count !== 1) {
        throw new ConflictError("O saldo do lote foi alterado por outra operação; recarregue e tente novamente");
      }
      const m = await recordMovement(tx, {
        unitId: batch.unitId,
        productId: batch.productId,
        batchId: batch.id,
        type: "ADJUSTMENT",
        quantity: diff,
        reason: data.reason,
        refType: "Batch",
        refId: batch.id,
        userId: data.userId,
      });
      return this.load(tx, m.id);
    });
  }
}
