import type { Prisma, PrismaClient } from "@prisma/client";
import type { StockMovementType } from "../../../domain/entities/StockMovement.js";

export type Db = Prisma.TransactionClient | PrismaClient;

export interface RecordMovementData {
  unitId: string;
  productId: string;
  batchId?: string | null;
  type: StockMovementType;
  quantity: number;
  reason?: string | null;
  document?: string | null;
  supplierId?: string | null;
  refType?: string | null;
  refId?: string | null;
  userId: string;
  createdAt?: Date;
}

export function recordMovement(db: Db, data: RecordMovementData) {
  return db.stockMovement.create({
    data: {
      unitId: data.unitId,
      productId: data.productId,
      batchId: data.batchId ?? null,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason ?? null,
      document: data.document ?? null,
      supplierId: data.supplierId ?? null,
      refType: data.refType ?? null,
      refId: data.refId ?? null,
      userId: data.userId,
      ...(data.createdAt ? { createdAt: data.createdAt } : {}),
    },
  });
}

/** Lotes utilizáveis (com saldo e não vencidos) da unidade, em ordem FEFO. */
export function fefoBatches(db: Db, unitId: string, productId: string, now = new Date()) {
  return db.batch.findMany({
    where: { unitId, productId, quantity: { gt: 0 }, expiresAt: { gt: now } },
    orderBy: [{ expiresAt: "asc" }, { receivedAt: "asc" }, { id: "asc" }],
  });
}

/** Baixa atômica: falha (retorna false) se o lote não tiver mais saldo suficiente. */
export async function decrementBatch(db: Db, batchId: string, qty: number): Promise<boolean> {
  const r = await db.batch.updateMany({
    where: { id: batchId, quantity: { gte: qty } },
    data: { quantity: { decrement: qty } },
  });
  return r.count === 1;
}

interface BalanceRow {
  id: string;
  productId: string;
  unitId: string;
  createdAt: Date;
}

/**
 * Saldo corrente após cada movimento. `unitScoped` = saldo por (unidade, produto);
 * caso contrário, por produto somando todas as unidades. Ordem: createdAt, id.
 */
export async function runningBalances(
  db: Db,
  rows: BalanceRow[],
  unitScoped: boolean,
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const groups = new Map<string, { productId: string; unitId: string; min: Date; max: Date }>();
  for (const r of rows) {
    const key = unitScoped ? `${r.unitId}|${r.productId}` : r.productId;
    const g = groups.get(key);
    if (!g) groups.set(key, { productId: r.productId, unitId: r.unitId, min: r.createdAt, max: r.createdAt });
    else {
      if (r.createdAt < g.min) g.min = r.createdAt;
      if (r.createdAt > g.max) g.max = r.createdAt;
    }
  }
  for (const g of groups.values()) {
    const scope: Prisma.StockMovementWhereInput = {
      productId: g.productId,
      ...(unitScoped ? { unitId: g.unitId } : {}),
    };
    const base = await db.stockMovement.aggregate({
      where: { ...scope, createdAt: { lt: g.min } },
      _sum: { quantity: true },
    });
    const seq = await db.stockMovement.findMany({
      where: { ...scope, createdAt: { gte: g.min, lte: g.max } },
      select: { id: true, quantity: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    let acc = base._sum.quantity ?? 0;
    for (const m of seq) {
      acc += m.quantity;
      out.set(m.id, acc);
    }
  }
  return out;
}
