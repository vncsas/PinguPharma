import type { PrismaClient, Prisma } from "@prisma/client";
import type {
  CancelDispensationData,
  CreateDispensationData,
  DailyDispensationPoint,
  DispensationDetail,
  DispensationListRow,
  IDispensationRepository,
  ListDispensationsQuery,
  PaginatedDispensations,
} from "../../../domain/repositories/IDispensationRepository.js";
import type { Dispensation, DispensationStatus } from "../../../domain/entities/Dispensation.js";
import type { ControlledClass } from "../../../domain/entities/Product.js";
import { AppError, ConflictError, NotFoundError } from "../../../shared/errors/AppError.js";
import { decrementBatch, fefoBatches, recordMovement, type Db } from "./stock-helpers.js";

function toDispensation(row: Prisma.DispensationGetPayload<object>): Dispensation {
  return {
    id: row.id,
    unitId: row.unitId,
    userId: row.userId,
    patientId: row.patientId,
    pharmacistId: row.pharmacistId,
    prescriptionId: row.prescriptionId,
    totalValue: Number(row.totalValue),
    status: row.status as DispensationStatus,
    cancelReason: row.cancelReason,
    canceledAt: row.canceledAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function loadDetail(db: Db, id: string): Promise<DispensationDetail | null> {
  const d = await db.dispensation.findUnique({
    where: { id },
    include: {
      unit: { select: { name: true } },
      user: { select: { name: true } },
      pharmacist: { select: { name: true } },
      patient: { select: { name: true, cpf: true, cns: true } },
      prescription: true,
      items: {
        include: {
          product: {
            select: { name: true, sku: true, presentation: true, measureUnit: true, controlledClass: true },
          },
          batch: { select: { lotNumber: true, expiresAt: true } },
        },
        orderBy: { id: "asc" },
      },
    },
  });
  if (!d) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { items: _items, ...base } = toDispensation(d);
  return {
    ...base,
    unitName: d.unit.name,
    userName: d.user.name,
    pharmacistName: d.pharmacist?.name ?? null,
    patientName: d.patient?.name ?? null,
    patientCpf: d.patient?.cpf ?? null,
    patientCns: d.patient?.cns ?? null,
    prescription: d.prescription
      ? {
          id: d.prescription.id,
          number: d.prescription.number,
          prescriberName: d.prescription.prescriberName,
          prescriberCouncil: d.prescription.prescriberCouncil,
          prescriberCouncilNumber: d.prescription.prescriberCouncilNumber,
          issuedAt: d.prescription.issuedAt,
          validUntil: d.prescription.validUntil,
        }
      : null,
    items: d.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product.name,
      productSku: i.product.sku,
      presentation: i.product.presentation,
      measureUnit: i.product.measureUnit,
      controlledClass: i.product.controlledClass as ControlledClass,
      batchId: i.batchId,
      lotNumber: i.batch?.lotNumber ?? null,
      expiresAt: i.batch?.expiresAt ?? null,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      subtotal: Number(i.subtotal),
    })),
  };
}

export class PrismaDispensationRepository implements IDispensationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Dispensation | null> {
    const d = await this.prisma.dispensation.findUnique({ where: { id } });
    return d ? toDispensation(d) : null;
  }

  findDetail(id: string): Promise<DispensationDetail | null> {
    return loadDetail(this.prisma, id);
  }

  async list(query: ListDispensationsQuery): Promise<PaginatedDispensations> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.DispensationWhereInput = {
      AND: [
        query.unitId ? { unitId: query.unitId } : {},
        query.status ? { status: query.status } : {},
        query.userId ? { userId: query.userId } : {},
        query.patientId ? { patientId: query.patientId } : {},
        query.prescriptionId ? { prescriptionId: query.prescriptionId } : {},
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
      this.prisma.dispensation.findMany({
        where,
        include: {
          unit: { select: { name: true } },
          user: { select: { name: true } },
          patient: { select: { name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.dispensation.count({ where }),
    ]);
    const data: DispensationListRow[] = rows.map((r) => ({
      ...toDispensation(r),
      unitName: r.unit.name,
      userName: r.user.name,
      patientName: r.patient?.name ?? null,
      itemCount: r._count.items,
    }));
    return { data, total, page, pageSize };
  }

  async latest(limit: number, unitId?: string) {
    const rows = await this.prisma.dispensation.findMany({
      where: unitId ? { unitId } : {},
      include: { user: { select: { name: true } }, patient: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map((r) => ({
      ...toDispensation(r),
      userName: r.user.name,
      patientName: r.patient?.name ?? null,
    }));
  }

  async countBetween(from: Date, to: Date, unitId?: string): Promise<DailyDispensationPoint[]> {
    const rows = await this.prisma.dispensation.findMany({
      where: { createdAt: { gte: from, lte: to }, status: "COMPLETED", ...(unitId ? { unitId } : {}) },
      select: { createdAt: true, totalValue: true },
    });
    const buckets = new Map<string, { totalValue: number; count: number }>();
    for (const r of rows) {
      const key = r.createdAt.toISOString().slice(0, 10);
      const cur = buckets.get(key) ?? { totalValue: 0, count: 0 };
      cur.totalValue += Number(r.totalValue);
      cur.count += 1;
      buckets.set(key, cur);
    }
    const points: DailyDispensationPoint[] = [];
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= to) {
      const key = cursor.toISOString().slice(0, 10);
      const b = buckets.get(key) ?? { totalValue: 0, count: 0 };
      points.push({ date: key, count: b.count, totalValue: Number(b.totalValue.toFixed(2)) });
      cursor.setDate(cursor.getDate() + 1);
    }
    return points;
  }

  async countToday(unitId?: string): Promise<{ count: number; totalValue: number }> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const agg = await this.prisma.dispensation.aggregate({
      where: { createdAt: { gte: start, lte: end }, status: "COMPLETED", ...(unitId ? { unitId } : {}) },
      _sum: { totalValue: true },
      _count: true,
    });
    return { count: agg._count, totalValue: Number(agg._sum.totalValue ?? 0) };
  }

  async dispensedQuantity(params: {
    patientId: string;
    productId: string;
    from: Date;
    to?: Date;
  }): Promise<number> {
    const agg = await this.prisma.dispensationItem.aggregate({
      where: {
        productId: params.productId,
        dispensation: {
          patientId: params.patientId,
          status: "COMPLETED",
          createdAt: { gte: params.from, ...(params.to ? { lte: params.to } : {}) },
        },
      },
      _sum: { quantity: true },
    });
    return agg._sum.quantity ?? 0;
  }

  async dispensedByPrescription(prescriptionId: string) {
    const rows = await this.prisma.dispensationItem.groupBy({
      by: ["productId"],
      where: { dispensation: { prescriptionId, status: "COMPLETED" } },
      _sum: { quantity: true },
    });
    return rows.map((r) => ({ productId: r.productId, quantity: r._sum.quantity ?? 0 }));
  }

  async create(data: CreateDispensationData): Promise<DispensationDetail> {
    if (data.items.length === 0) throw new AppError("A dispensação deve conter ao menos um item", 422);

    return this.prisma.$transaction(async (tx) => {
      const unit = await tx.unit.findUnique({ where: { id: data.unitId } });
      if (!unit) throw new NotFoundError("Unidade");
      if (data.patientId) {
        const p = await tx.patient.findUnique({ where: { id: data.patientId } });
        if (!p) throw new NotFoundError("Paciente");
      }

      const d = await tx.dispensation.create({
        data: {
          unitId: data.unitId,
          userId: data.userId,
          patientId: data.patientId ?? null,
          pharmacistId: data.pharmacistId ?? null,
          prescriptionId: data.prescriptionId ?? null,
          totalValue: 0,
        },
      });

      let total = 0;
      for (const item of data.items) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new AppError("Quantidade deve ser maior que zero", 422);
        }
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new NotFoundError("Medicamento");
        if (!product.active) throw new ConflictError(`Medicamento '${product.name}' está inativo`);

        const batches = await fefoBatches(tx, data.unitId, product.id);
        const stock = batches.reduce((s, b) => s + b.quantity, 0);
        if (stock < item.quantity) {
          throw new ConflictError(
            `Estoque insuficiente de '${product.name}' na unidade (necessário ${item.quantity}, disponível ${stock})`,
          );
        }

        let remaining = item.quantity;
        for (const batch of batches) {
          if (remaining <= 0) break;
          const take = Math.min(remaining, batch.quantity);
          if (!(await decrementBatch(tx, batch.id, take))) {
            throw new ConflictError(`Estoque de '${product.name}' alterado durante a operação; tente novamente`);
          }
          const subtotal = Number((take * Number(product.price)).toFixed(2));
          await tx.dispensationItem.create({
            data: {
              dispensationId: d.id,
              productId: product.id,
              batchId: batch.id,
              quantity: take,
              unitPrice: Number(product.price),
              subtotal,
            },
          });
          await recordMovement(tx, {
            unitId: data.unitId,
            productId: product.id,
            batchId: batch.id,
            type: "DISPENSATION",
            quantity: -take,
            refType: "Dispensation",
            refId: d.id,
            userId: data.userId,
          });
          total += subtotal;
          remaining -= take;
        }
      }

      await tx.dispensation.update({
        where: { id: d.id },
        data: { totalValue: Number(total.toFixed(2)) },
      });
      const detail = await loadDetail(tx, d.id);
      if (!detail) throw new AppError("Falha ao registrar dispensação", 500);
      return detail;
    });
  }

  async cancel(id: string, data: CancelDispensationData): Promise<DispensationDetail> {
    return this.prisma.$transaction(async (tx) => {
      const d = await tx.dispensation.findUnique({ where: { id }, include: { items: true } });
      if (!d) throw new NotFoundError("Dispensação");
      if (d.status === "CANCELED") throw new ConflictError("Dispensação já cancelada");

      const claimed = await tx.dispensation.updateMany({
        where: { id, status: "COMPLETED" },
        data: { status: "CANCELED", cancelReason: data.reason, canceledAt: new Date() },
      });
      if (claimed.count !== 1) throw new ConflictError("Dispensação já cancelada");

      for (const item of d.items) {
        if (!item.batchId) continue;
        await tx.batch.update({
          where: { id: item.batchId },
          data: { quantity: { increment: item.quantity } },
        });
        await recordMovement(tx, {
          unitId: d.unitId,
          productId: item.productId,
          batchId: item.batchId,
          type: "DISPENSATION_CANCEL",
          quantity: item.quantity,
          reason: data.reason,
          refType: "Dispensation",
          refId: d.id,
          userId: data.userId,
        });
      }

      const detail = await loadDetail(tx, id);
      if (!detail) throw new AppError("Dispensação não encontrada após cancelamento", 500);
      return detail;
    });
  }
}
