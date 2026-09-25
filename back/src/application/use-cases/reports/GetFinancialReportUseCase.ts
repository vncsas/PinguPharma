import type { PrismaClient } from "@prisma/client";

export interface FinancialReportInput {
  from: Date;
  to: Date;
}

export interface FinancialReport {
  totals: {
    revenue: number;
    salesCount: number;
    itemsSold: number;
    averageTicket: number;
    cancelCount: number;
  };
  daily: { date: string; total: number; count: number }[];
  paymentBreakdown: { paymentMethod: string; total: number; count: number }[];
  topProducts: {
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    revenue: number;
  }[];
  topSellers: { userId: string; name: string; total: number; count: number }[];
}

export class GetFinancialReportUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute({ from, to }: FinancialReportInput): Promise<FinancialReport> {
    const [salesCompleted, cancelCount, items] = await Promise.all([
      this.prisma.sale.findMany({
        where: { createdAt: { gte: from, lte: to }, status: "COMPLETED" },
        include: { user: { select: { name: true } }, items: true },
      }),
      this.prisma.sale.count({
        where: { createdAt: { gte: from, lte: to }, status: "CANCELED" },
      }),
      this.prisma.saleItem.findMany({
        where: { sale: { createdAt: { gte: from, lte: to }, status: "COMPLETED" } },
        include: { product: { select: { name: true, sku: true } } },
      }),
    ]);

    const revenue = salesCompleted.reduce((s, x) => s + Number(x.totalAmount), 0);
    const itemsSold = items.reduce((s, i) => s + i.quantity, 0);
    const salesCount = salesCompleted.length;
    const averageTicket = salesCount ? revenue / salesCount : 0;

    const dailyMap = new Map<string, { total: number; count: number }>();
    for (const s of salesCompleted) {
      const k = s.createdAt.toISOString().slice(0, 10);
      const cur = dailyMap.get(k) ?? { total: 0, count: 0 };
      cur.total += Number(s.totalAmount);
      cur.count += 1;
      dailyMap.set(k, cur);
    }
    const daily: FinancialReport["daily"] = [];
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(to);
    while (cursor <= end) {
      const k = cursor.toISOString().slice(0, 10);
      const b = dailyMap.get(k) ?? { total: 0, count: 0 };
      daily.push({ date: k, total: b.total, count: b.count });
      cursor.setDate(cursor.getDate() + 1);
    }

    const payMap = new Map<string, { total: number; count: number }>();
    for (const s of salesCompleted) {
      const cur = payMap.get(s.paymentMethod) ?? { total: 0, count: 0 };
      cur.total += Number(s.totalAmount);
      cur.count += 1;
      payMap.set(s.paymentMethod, cur);
    }

    const prodMap = new Map<string, { name: string; sku: string; quantity: number; revenue: number }>();
    for (const i of items) {
      const cur = prodMap.get(i.productId) ?? {
        name: i.product.name,
        sku: i.product.sku,
        quantity: 0,
        revenue: 0,
      };
      cur.quantity += i.quantity;
      cur.revenue += Number(i.subtotal);
      prodMap.set(i.productId, cur);
    }
    const topProducts = Array.from(prodMap.entries())
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const sellerMap = new Map<string, { name: string; total: number; count: number }>();
    for (const s of salesCompleted) {
      const cur = sellerMap.get(s.userId) ?? { name: s.user.name, total: 0, count: 0 };
      cur.total += Number(s.totalAmount);
      cur.count += 1;
      sellerMap.set(s.userId, cur);
    }
    const topSellers = Array.from(sellerMap.entries())
      .map(([userId, v]) => ({ userId, ...v }))
      .sort((a, b) => b.total - a.total);

    return {
      totals: { revenue, salesCount, itemsSold, averageTicket, cancelCount },
      daily,
      paymentBreakdown: Array.from(payMap.entries()).map(([paymentMethod, v]) => ({
        paymentMethod,
        ...v,
      })),
      topProducts,
      topSellers,
    };
  }

  async exportCsv({ from, to }: FinancialReportInput): Promise<string> {
    const report = await this.execute({ from, to });
    const rows = [
      ["Data", "Vendas", "Faturamento"],
      ...report.daily.map((d) => [d.date, String(d.count), d.total.toFixed(2)]),
      [],
      ["Top produtos"],
      ["Produto", "SKU", "Quantidade", "Receita"],
      ...report.topProducts.map((p) => [p.name, p.sku, String(p.quantity), p.revenue.toFixed(2)]),
      [],
      ["Top vendedores"],
      ["Vendedor", "Pedidos", "Faturamento"],
      ...report.topSellers.map((s) => [s.name, String(s.count), s.total.toFixed(2)]),
    ];
    return rows
      .map((r) => r.map((c) => (c.includes(",") || c.includes('"') ? `"${c.replace(/"/g, '""')}"` : c)).join(","))
      .join("\n");
  }
}
