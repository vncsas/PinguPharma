import type { PrismaClient, Prisma } from "@prisma/client";
import type {
  CreateProductData,
  IProductRepository,
  ListProductsQuery,
  PaginatedProducts,
  UpdateProductData,
} from "../../../domain/repositories/IProductRepository.js";
import type { Product, ProductWithStock } from "../../../domain/entities/Product.js";

function toProduct(row: Prisma.ProductGetPayload<{}>): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    description: row.description,
    price: Number(row.price),
    minStockAlert: row.minStockAlert,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<ProductWithStock | null> {
    const p = await this.prisma.product.findUnique({
      where: { id },
      include: { batches: true },
    });
    if (!p) return null;
    const totalStock = p.batches.reduce((s, b) => s + b.quantity, 0);
    const nearest = p.batches
      .filter((b) => b.quantity > 0)
      .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime())[0];
    return {
      ...toProduct(p),
      totalStock,
      nearestExpiration: nearest ? nearest.expiresAt : null,
      batchCount: p.batches.length,
    };
  }

  async findBySku(sku: string): Promise<Product | null> {
    const p = await this.prisma.product.findUnique({ where: { sku } });
    return p ? toProduct(p) : null;
  }

  async list(query: ListProductsQuery): Promise<PaginatedProducts> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.ProductWhereInput = {
      AND: [
        query.active === undefined ? {} : { active: query.active },
        query.search
          ? {
              OR: [
                { name: { contains: query.search} },
                { sku: { contains: query.search} },
              ],
            }
          : {},
      ],
    };

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { batches: true },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    let data: ProductWithStock[] = rows.map((p) => {
      const totalStock = p.batches.reduce((s, b) => s + b.quantity, 0);
      const nearest = p.batches
        .filter((b) => b.quantity > 0)
        .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime())[0];
      return {
        ...toProduct(p),
        totalStock,
        nearestExpiration: nearest ? nearest.expiresAt : null,
        batchCount: p.batches.length,
      };
    });

    if (query.lowStockOnly) {
      data = data.filter((p) => p.totalStock <= p.minStockAlert);
    }

    return { data, total, page, pageSize };
  }

  async create(data: CreateProductData): Promise<Product> {
    const p = await this.prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description ?? null,
        price: data.price,
        minStockAlert: data.minStockAlert ?? 0,
      },
    });
    return toProduct(p);
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    const p = await this.prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.sku !== undefined ? { sku: data.sku } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.minStockAlert !== undefined ? { minStockAlert: data.minStockAlert } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
    });
    return toProduct(p);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  async countLowStock(): Promise<number> {
    const rows = await this.prisma.product.findMany({ include: { batches: true } });
    return rows.filter((r) => r.batches.reduce((s, b) => s + b.quantity, 0) <= r.minStockAlert).length;
  }

  async countExpiringSoon(days: number): Promise<number> {
    const limit = new Date();
    limit.setDate(limit.getDate() + days);
    return this.prisma.batch.count({
      where: { expiresAt: { lte: limit }, quantity: { gt: 0 } },
    });
  }
}
