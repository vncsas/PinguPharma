import type { PrismaClient, Prisma } from "@prisma/client";
import type {
  CreateProductData,
  LowStockProduct,
  IProductRepository,
  ListProductsQuery,
  PaginatedProducts,
  UpdateProductData,
} from "../../../domain/repositories/IProductRepository.js";
import type { ControlledClass, Product, ProductWithStock } from "../../../domain/entities/Product.js";

function toProduct(row: Prisma.ProductGetPayload<object>): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    description: row.description,
    price: Number(row.price),
    minStockAlert: row.minStockAlert,
    active: row.active,
    controlledClass: row.controlledClass as ControlledClass,
    activeIngredient: row.activeIngredient,
    presentation: row.presentation,
    measureUnit: row.measureUnit,
    manufacturer: row.manufacturer,
    renameCode: row.renameCode,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string, unitId?: string): Promise<ProductWithStock | null> {
    const p = await this.prisma.product.findUnique({
      where: { id },
      include: { batches: unitId ? { where: { unitId } } : true },
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
                { name: { contains: query.search } },
                { sku: { contains: query.search } },
                { activeIngredient: { contains: query.search } },
                { renameCode: { contains: query.search } },
              ],
            }
          : {},
        query.controlled === undefined
          ? {}
          : query.controlled
            ? { controlledClass: { not: "NONE" } }
            : { controlledClass: "NONE" },
      ],
    };

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { batches: query.unitId ? { where: { unitId: query.unitId } } : true },
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
      data = data.filter((p) => p.minStockAlert > 0 && p.totalStock <= p.minStockAlert);
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
        controlledClass: data.controlledClass ?? "NONE",
        activeIngredient: data.activeIngredient ?? null,
        presentation: data.presentation ?? null,
        measureUnit: data.measureUnit ?? null,
        manufacturer: data.manufacturer ?? null,
        renameCode: data.renameCode ?? null,
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
        ...(data.controlledClass !== undefined ? { controlledClass: data.controlledClass } : {}),
        ...(data.activeIngredient !== undefined ? { activeIngredient: data.activeIngredient } : {}),
        ...(data.presentation !== undefined ? { presentation: data.presentation } : {}),
        ...(data.measureUnit !== undefined ? { measureUnit: data.measureUnit } : {}),
        ...(data.manufacturer !== undefined ? { manufacturer: data.manufacturer } : {}),
        ...(data.renameCode !== undefined ? { renameCode: data.renameCode } : {}),
      },
    });
    return toProduct(p);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  async listLowStock(unitId?: string): Promise<LowStockProduct[]> {
    const [products, units, sums] = await Promise.all([
      this.prisma.product.findMany({
        where: { active: true, minStockAlert: { gt: 0 } },
        orderBy: { name: "asc" },
      }),
      this.prisma.unit.findMany({
        where: unitId ? { id: unitId } : { active: true },
        orderBy: { name: "asc" },
      }),
      this.prisma.batch.groupBy({
        by: ["unitId", "productId"],
        where: unitId ? { unitId } : {},
        _sum: { quantity: true },
      }),
    ]);
    const stock = new Map(sums.map((r) => [`${r.unitId}|${r.productId}`, r._sum.quantity ?? 0]));
    const out: LowStockProduct[] = [];
    for (const u of units) {
      for (const p of products) {
        const totalStock = stock.get(`${u.id}|${p.id}`) ?? 0;
        if (totalStock <= p.minStockAlert) {
          out.push({
            id: p.id,
            name: p.name,
            sku: p.sku,
            unitId: u.id,
            unitName: u.name,
            totalStock,
            minStockAlert: p.minStockAlert,
          });
        }
      }
    }
    return out;
  }

  async countLowStock(unitId?: string): Promise<number> {
    return (await this.listLowStock(unitId)).length;
  }

  async countExpiringSoon(days: number, unitId?: string): Promise<number> {
    const limit = new Date();
    limit.setDate(limit.getDate() + days);
    return this.prisma.batch.count({
      where: { ...(unitId ? { unitId } : {}), expiresAt: { lte: limit }, quantity: { gt: 0 } },
    });
  }
}
