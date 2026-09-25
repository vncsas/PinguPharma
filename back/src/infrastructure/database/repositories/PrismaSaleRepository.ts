import type { PrismaClient, Prisma } from "@prisma/client";
import type {
  CreateSaleData,
  DailyRevenuePoint,
  ISaleRepository,
  ListSalesQuery,
  PaginatedSales,
  SaleDetail,
} from "../../../domain/repositories/ISaleRepository.js";
import type { PaymentMethod, Sale, SaleStatus } from "../../../domain/entities/Sale.js";
import { AppError, ConflictError, NotFoundError } from "../../../shared/errors/AppError.js";

function toSale(row: Prisma.SaleGetPayload<{}>): Sale {
  return {
    id: row.id,
    userId: row.userId,
    customerId: row.customerId,
    clientName: row.clientName,
    paymentMethod: row.paymentMethod as PaymentMethod,
    totalAmount: Number(row.totalAmount),
    status: row.status as SaleStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function loadDetail(
  prisma: Prisma.TransactionClient | PrismaClient,
  id: string,
): Promise<SaleDetail | null> {
  const s = await prisma.sale.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      customer: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true, sku: true } },
          batch: { select: { lotNumber: true } },
        },
      },
    },
  });
  if (!s) return null;
  return {
    ...toSale(s),
    userName: s.user.name,
    customerName: s.customer?.name ?? null,
    items: s.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product.name,
      productSku: i.product.sku,
      batchId: i.batchId,
      lotNumber: i.batch?.lotNumber ?? null,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      subtotal: Number(i.subtotal),
    })),
  };
}

export class PrismaSaleRepository implements ISaleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Sale | null> {
    const s = await this.prisma.sale.findUnique({ where: { id } });
    return s ? toSale(s) : null;
  }

  async findDetail(id: string): Promise<SaleDetail | null> {
    return loadDetail(this.prisma, id);
  }

  async list(query: ListSalesQuery): Promise<PaginatedSales> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.SaleWhereInput = {
      AND: [
        query.status ? { status: query.status } : {},
        query.userId ? { userId: query.userId } : {},
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
      this.prisma.sale.findMany({
        where,
        include: {
          user: { select: { name: true } },
          customer: { select: { name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.sale.count({ where }),
    ]);

    const data = rows.map((r) => ({
      ...toSale(r),
      userName: r.user.name,
      customerName: r.customer?.name ?? null,
      itemCount: r._count.items,
    }));
    return { data, total, page, pageSize };
  }

  async latest(limit: number): Promise<(Sale & { userName: string })[]> {
    const rows = await this.prisma.sale.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map((r) => ({ ...toSale(r), userName: r.user.name }));
  }

  async revenueBetween(from: Date, to: Date): Promise<DailyRevenuePoint[]> {
    const rows = await this.prisma.sale.findMany({
      where: { createdAt: { gte: from, lte: to }, status: "COMPLETED" },
      select: { createdAt: true, totalAmount: true },
    });

    const buckets = new Map<string, { total: number; count: number }>();
    for (const r of rows) {
      const key = r.createdAt.toISOString().slice(0, 10);
      const cur = buckets.get(key) ?? { total: 0, count: 0 };
      cur.total += Number(r.totalAmount);
      cur.count += 1;
      buckets.set(key, cur);
    }

    const points: DailyRevenuePoint[] = [];
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(to);
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      const b = buckets.get(key) ?? { total: 0, count: 0 };
      points.push({ date: key, total: b.total, count: b.count });
      cursor.setDate(cursor.getDate() + 1);
    }
    return points;
  }

  async countToday(): Promise<{ count: number; total: number }> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const agg = await this.prisma.sale.aggregate({
      where: { createdAt: { gte: start, lte: end }, status: "COMPLETED" },
      _sum: { totalAmount: true },
      _count: true,
    });
    return { count: agg._count, total: Number(agg._sum.totalAmount ?? 0) };
  }

  async create(data: CreateSaleData): Promise<SaleDetail> {
    if (data.items.length === 0) throw new AppError("Sale must contain at least one item", 422);

    return this.prisma.$transaction(async (tx) => {
      let customerName = data.clientName ?? "Consumidor Final";
      if (data.customerId) {
        const c = await tx.customer.findUnique({ where: { id: data.customerId } });
        if (!c) throw new NotFoundError("Customer");
        customerName = c.name;
      }

      const sale = await tx.sale.create({
        data: {
          userId: data.userId,
          customerId: data.customerId ?? null,
          clientName: customerName,
          paymentMethod: data.paymentMethod,
          totalAmount: 0,
        },
      });

      let total = 0;

      for (const item of data.items) {
        if (item.quantity <= 0) throw new AppError("Quantity must be > 0", 422);

        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new NotFoundError(`Product ${item.productId}`);
        if (!product.active) {
          throw new ConflictError(`Product '${product.name}' is not active`);
        }

        const batches = await tx.batch.findMany({
          where: { productId: product.id, quantity: { gt: 0 } },
          orderBy: [{ expiresAt: "asc" }, { receivedAt: "asc" }],
        });

        const stock = batches.reduce((s, b) => s + b.quantity, 0);
        if (stock < item.quantity) {
          throw new ConflictError(
            `Insufficient stock for '${product.name}' (need ${item.quantity}, have ${stock})`,
          );
        }

        let remaining = item.quantity;
        for (const batch of batches) {
          if (remaining <= 0) break;
          const take = Math.min(remaining, batch.quantity);

          const subtotal = Number((take * Number(product.price)).toFixed(2));
          await tx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: product.id,
              batchId: batch.id,
              quantity: take,
              unitPrice: Number(product.price),
              subtotal,
            },
          });

          await tx.batch.update({
            where: { id: batch.id },
            data: { quantity: batch.quantity - take },
          });

          total += subtotal;
          remaining -= take;
        }
      }

      total = Number(total.toFixed(2));
      await tx.sale.update({ where: { id: sale.id }, data: { totalAmount: total } });

      const detail = await loadDetail(tx, sale.id);
      if (!detail) throw new AppError("Sale creation failed", 500);
      return detail;
    });
  }

  async cancel(id: string): Promise<SaleDetail> {
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({ where: { id }, include: { items: true } });
      if (!sale) throw new NotFoundError("Sale");
      if (sale.status === "CANCELED") throw new ConflictError("Sale already canceled");

      for (const item of sale.items) {
        if (item.batchId) {
          await tx.batch.update({
            where: { id: item.batchId },
            data: { quantity: { increment: item.quantity } },
          });
        }
      }

      await tx.sale.update({ where: { id }, data: { status: "CANCELED" } });
      const detail = await loadDetail(tx, id);
      if (!detail) throw new AppError("Sale not found after cancel", 500);
      return detail;
    });
  }
}
