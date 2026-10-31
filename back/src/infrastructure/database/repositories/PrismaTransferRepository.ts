import type { PrismaClient, Prisma } from "@prisma/client";
import type {
  ITransferRepository,
  ListTransfersQuery,
  PaginatedTransfers,
  RequestTransferData,
} from "../../../domain/repositories/ITransferRepository.js";
import type { TransferDetail, TransferStatus } from "../../../domain/entities/Transfer.js";
import { AppError, ConflictError, NotFoundError } from "../../../shared/errors/AppError.js";
import { decrementBatch, fefoBatches, recordMovement, type Db } from "./stock-helpers.js";

const detailInclude = {
  fromUnit: { select: { name: true } },
  toUnit: { select: { name: true } },
  items: { include: { product: { select: { name: true, sku: true } } }, orderBy: { id: "asc" } },
} satisfies Prisma.TransferInclude;

type Payload = Prisma.TransferGetPayload<{ include: typeof detailInclude }>;

async function userNames(db: Db, ids: (string | null)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((i): i is string => !!i))];
  const users = await db.user.findMany({ where: { id: { in: unique } }, select: { id: true, name: true } });
  return new Map(users.map((u) => [u.id, u.name]));
}

async function toDetail(db: Db, rows: Payload[]): Promise<TransferDetail[]> {
  const names = await userNames(
    db,
    rows.flatMap((r) => [r.requestedBy, r.sentBy, r.receivedBy]),
  );
  return rows.map((r) => ({
    id: r.id,
    fromUnitId: r.fromUnitId,
    toUnitId: r.toUnitId,
    status: r.status as TransferStatus,
    requestedBy: r.requestedBy,
    sentBy: r.sentBy,
    receivedBy: r.receivedBy,
    notes: r.notes,
    createdAt: r.createdAt,
    sentAt: r.sentAt,
    receivedAt: r.receivedAt,
    fromUnitName: r.fromUnit.name,
    toUnitName: r.toUnit.name,
    requestedByName: names.get(r.requestedBy) ?? "—",
    sentByName: r.sentBy ? (names.get(r.sentBy) ?? null) : null,
    receivedByName: r.receivedBy ? (names.get(r.receivedBy) ?? null) : null,
    items: r.items.map((i) => ({
      id: i.id,
      transferId: i.transferId,
      productId: i.productId,
      quantity: i.quantity,
      batchId: i.batchId,
      lotNumber: i.lotNumber,
      expiresAt: i.expiresAt,
      costPrice: i.costPrice === null ? null : Number(i.costPrice),
      productName: i.product.name,
      productSku: i.product.sku,
    })),
  }));
}

async function loadDetail(db: Db, id: string): Promise<TransferDetail> {
  const row = await db.transfer.findUnique({ where: { id }, include: detailInclude });
  if (!row) throw new NotFoundError("Transferência");
  return (await toDetail(db, [row]))[0];
}

function appendNote(notes: string | null, label: string, reason?: string): string | null {
  if (!reason) return notes;
  const line = `${label}: ${reason}`;
  return notes ? `${notes}\n${line}` : line;
}

export class PrismaTransferRepository implements ITransferRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findDetail(id: string): Promise<TransferDetail | null> {
    const row = await this.prisma.transfer.findUnique({ where: { id }, include: detailInclude });
    return row ? (await toDetail(this.prisma, [row]))[0] : null;
  }

  async list(query: ListTransfersQuery): Promise<PaginatedTransfers> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    let unitFilter: Prisma.TransferWhereInput = {};
    if (query.unitId) {
      if (query.direction === "in") unitFilter = { toUnitId: query.unitId };
      else if (query.direction === "out") unitFilter = { fromUnitId: query.unitId };
      else unitFilter = { OR: [{ fromUnitId: query.unitId }, { toUnitId: query.unitId }] };
    }
    const where: Prisma.TransferWhereInput = {
      AND: [unitFilter, query.status ? { status: query.status } : {}],
    };
    const [rows, total] = await Promise.all([
      this.prisma.transfer.findMany({
        where,
        include: detailInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.transfer.count({ where }),
    ]);
    return { data: await toDetail(this.prisma, rows), total, page, pageSize };
  }

  countPending(unitId?: string): Promise<number> {
    return this.prisma.transfer.count({
      where: unitId
        ? {
            OR: [
              { fromUnitId: unitId, status: "REQUESTED" },
              { toUnitId: unitId, status: "SENT" },
            ],
          }
        : { status: { in: ["REQUESTED", "SENT"] } },
    });
  }

  async request(data: RequestTransferData): Promise<TransferDetail> {
    if (data.fromUnitId === data.toUnitId) {
      throw new AppError("Unidade de origem e destino devem ser diferentes", 422);
    }
    if (data.items.length === 0) throw new AppError("A transferência deve conter ao menos um item", 422);

    return this.prisma.$transaction(async (tx) => {
      const [from, to] = await Promise.all([
        tx.unit.findUnique({ where: { id: data.fromUnitId } }),
        tx.unit.findUnique({ where: { id: data.toUnitId } }),
      ]);
      if (!from || !to) throw new NotFoundError("Unidade");
      for (const it of data.items) {
        if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
          throw new AppError("Quantidade deve ser maior que zero", 422);
        }
        const p = await tx.product.findUnique({ where: { id: it.productId }, select: { id: true } });
        if (!p) throw new NotFoundError("Medicamento");
      }
      const t = await tx.transfer.create({
        data: {
          fromUnitId: data.fromUnitId,
          toUnitId: data.toUnitId,
          requestedBy: data.requestedBy,
          notes: data.notes ?? null,
          items: { create: data.items.map((i) => ({ productId: i.productId, quantity: i.quantity })) },
        },
      });
      return loadDetail(tx, t.id);
    });
  }

  async send(id: string, userId: string): Promise<TransferDetail> {
    return this.prisma.$transaction(async (tx) => {
      const t = await tx.transfer.findUnique({ where: { id }, include: { items: true, toUnit: true } });
      if (!t) throw new NotFoundError("Transferência");
      const claimed = await tx.transfer.updateMany({
        where: { id, status: "REQUESTED" },
        data: { status: "SENT", sentBy: userId, sentAt: new Date() },
      });
      if (claimed.count !== 1) throw new ConflictError("Somente transferências solicitadas podem ser enviadas");

      for (const item of t.items) {
        const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
        const batches = await fefoBatches(tx, t.fromUnitId, item.productId);
        const stock = batches.reduce((s, b) => s + b.quantity, 0);
        if (stock < item.quantity) {
          throw new ConflictError(
            `Estoque insuficiente de '${product.name}' na unidade de origem (necessário ${item.quantity}, disponível ${stock})`,
          );
        }
        let remaining = item.quantity;
        let first = true;
        for (const batch of batches) {
          if (remaining <= 0) break;
          const take = Math.min(remaining, batch.quantity);
          if (!(await decrementBatch(tx, batch.id, take))) {
            throw new ConflictError(`Estoque de '${product.name}' alterado durante a operação; tente novamente`);
          }
          const lot = {
            quantity: take,
            batchId: batch.id,
            lotNumber: batch.lotNumber,
            expiresAt: batch.expiresAt,
            costPrice: Number(batch.costPrice),
          };
          if (first) {
            await tx.transferItem.update({ where: { id: item.id }, data: lot });
            first = false;
          } else {
            await tx.transferItem.create({ data: { transferId: t.id, productId: item.productId, ...lot } });
          }
          await recordMovement(tx, {
            unitId: t.fromUnitId,
            productId: item.productId,
            batchId: batch.id,
            type: "TRANSFER_OUT",
            quantity: -take,
            reason: `Transferência para ${t.toUnit.name}`,
            document: `Transferência ${t.id}`,
            refType: "Transfer",
            refId: t.id,
            userId,
          });
          remaining -= take;
        }
      }
      return loadDetail(tx, id);
    });
  }

  async receive(id: string, userId: string): Promise<TransferDetail> {
    return this.prisma.$transaction(async (tx) => {
      const t = await tx.transfer.findUnique({ where: { id }, include: { items: true, fromUnit: true } });
      if (!t) throw new NotFoundError("Transferência");
      const claimed = await tx.transfer.updateMany({
        where: { id, status: "SENT" },
        data: { status: "RECEIVED", receivedBy: userId, receivedAt: new Date() },
      });
      if (claimed.count !== 1) throw new ConflictError("Somente transferências enviadas podem ser recebidas");

      for (const item of t.items) {
        if (!item.lotNumber || !item.expiresAt) {
          throw new AppError("Item da transferência sem lote/validade", 500);
        }
        const document = `Transferência ${t.id}`;
        const batch = await tx.batch.create({
          data: {
            unitId: t.toUnitId,
            productId: item.productId,
            lotNumber: item.lotNumber,
            quantity: item.quantity,
            costPrice: item.costPrice ?? 0,
            expiresAt: item.expiresAt,
            document,
            entryType: "ENTRY_TRANSFER",
          },
        });
        await recordMovement(tx, {
          unitId: t.toUnitId,
          productId: item.productId,
          batchId: batch.id,
          type: "ENTRY_TRANSFER",
          quantity: item.quantity,
          reason: `Transferência de ${t.fromUnit.name}`,
          document,
          refType: "Transfer",
          refId: t.id,
          userId,
        });
      }
      return loadDetail(tx, id);
    });
  }

  reject(id: string, userId: string, reason?: string): Promise<TransferDetail> {
    return this.close(id, userId, "REJECTED", "Motivo da recusa", reason);
  }

  cancel(id: string, userId: string, reason?: string): Promise<TransferDetail> {
    return this.close(id, userId, "CANCELED", "Motivo do cancelamento", reason);
  }

  private async close(
    id: string,
    userId: string,
    target: "REJECTED" | "CANCELED",
    label: string,
    reason?: string,
  ): Promise<TransferDetail> {
    return this.prisma.$transaction(async (tx) => {
      const t = await tx.transfer.findUnique({ where: { id }, include: { items: true, toUnit: true } });
      if (!t) throw new NotFoundError("Transferência");
      if (t.status !== "REQUESTED" && t.status !== "SENT") {
        throw new ConflictError("Transferência já finalizada");
      }
      const claimed = await tx.transfer.updateMany({
        where: { id, status: t.status },
        data: { status: target, notes: appendNote(t.notes, label, reason) },
      });
      if (claimed.count !== 1) throw new ConflictError("Transferência alterada por outra operação");

      if (t.status === "SENT") {
        for (const item of t.items) {
          let batchId = item.batchId;
          const existing = batchId ? await tx.batch.findUnique({ where: { id: batchId } }) : null;
          if (existing) {
            await tx.batch.update({ where: { id: existing.id }, data: { quantity: { increment: item.quantity } } });
          } else {
            if (!item.lotNumber || !item.expiresAt) continue;
            const nb = await tx.batch.create({
              data: {
                unitId: t.fromUnitId,
                productId: item.productId,
                lotNumber: item.lotNumber,
                quantity: item.quantity,
                costPrice: item.costPrice ?? 0,
                expiresAt: item.expiresAt,
                document: `Estorno transferência ${t.id}`,
              },
            });
            batchId = nb.id;
          }
          await recordMovement(tx, {
            unitId: t.fromUnitId,
            productId: item.productId,
            batchId,
            type: "ADJUSTMENT",
            quantity: item.quantity,
            reason: `Estorno de transferência ${target === "REJECTED" ? "recusada" : "cancelada"}`,
            document: `Transferência ${t.id}`,
            refType: "Transfer",
            refId: t.id,
            userId,
          });
        }
      }
      return loadDetail(tx, id);
    });
  }
}
