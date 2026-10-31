import type { PrismaClient, Prisma } from "@prisma/client";
import type {
  ConsumptionRow,
  ControlledBalanceRow,
  ControlledLedger,
  ControlledLedgerEntry,
  CoverageStatus,
  DispensationSummaryRow,
  IReportRepository,
  LossReport,
  LossRow,
  StockCoverageRow,
} from "../../../domain/repositories/IReportRepository.js";
import type { ControlledClass } from "../../../domain/entities/Product.js";
import type { StockMovementType } from "../../../domain/entities/StockMovement.js";

const COVERAGE_WINDOW_DAYS = 30;
const CRITICAL_DAYS = 7;
const LOW_DAYS = 15;

const round2 = (n: number) => Number(n.toFixed(2));

export class PrismaReportRepository implements IReportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async consumption(params: {
    unitId?: string;
    productId?: string;
    from: Date;
    to: Date;
  }): Promise<ConsumptionRow[]> {
    const items = await this.prisma.dispensationItem.findMany({
      where: {
        ...(params.productId ? { productId: params.productId } : {}),
        dispensation: {
          status: "COMPLETED",
          createdAt: { gte: params.from, lte: params.to },
          ...(params.unitId ? { unitId: params.unitId } : {}),
        },
      },
      select: {
        dispensationId: true,
        productId: true,
        quantity: true,
        subtotal: true,
        product: { select: { name: true, sku: true } },
        dispensation: { select: { unitId: true, unit: { select: { name: true } } } },
      },
    });
    const map = new Map<string, ConsumptionRow & { ids: Set<string> }>();
    for (const i of items) {
      const key = `${i.dispensation.unitId}|${i.productId}`;
      let r = map.get(key);
      if (!r) {
        r = {
          productId: i.productId,
          productName: i.product.name,
          productSku: i.product.sku,
          unitId: i.dispensation.unitId,
          unitName: i.dispensation.unit.name,
          quantity: 0,
          dispensationCount: 0,
          totalValue: 0,
          ids: new Set(),
        };
        map.set(key, r);
      }
      r.quantity += i.quantity;
      r.totalValue += Number(i.subtotal);
      r.ids.add(i.dispensationId);
    }
    return [...map.values()]
      .map(({ ids, ...r }) => ({ ...r, dispensationCount: ids.size, totalValue: round2(r.totalValue) }))
      .sort((a, b) => b.quantity - a.quantity);
  }

  async stockCoverage(params: { unitId?: string; productId?: string }): Promise<StockCoverageRow[]> {
    const since = new Date();
    since.setDate(since.getDate() - COVERAGE_WINDOW_DAYS);

    const [units, stockGroups, consGroups, alertProducts] = await Promise.all([
      this.prisma.unit.findMany({ where: params.unitId ? { id: params.unitId } : { active: true } }),
      this.prisma.batch.groupBy({
        by: ["unitId", "productId"],
        where: {
          ...(params.unitId ? { unitId: params.unitId } : {}),
          ...(params.productId ? { productId: params.productId } : {}),
          product: { active: true },
        },
        _sum: { quantity: true },
      }),
      this.prisma.stockMovement.groupBy({
        by: ["unitId", "productId"],
        where: {
          type: { in: ["DISPENSATION", "DISPENSATION_CANCEL"] },
          createdAt: { gte: since },
          ...(params.unitId ? { unitId: params.unitId } : {}),
          ...(params.productId ? { productId: params.productId } : {}),
        },
        _sum: { quantity: true },
      }),
      this.prisma.product.findMany({
        where: { active: true, minStockAlert: { gt: 0 }, ...(params.productId ? { id: params.productId } : {}) },
        select: { id: true },
      }),
    ]);

    const stock = new Map(stockGroups.map((g) => [`${g.unitId}|${g.productId}`, g._sum.quantity ?? 0]));
    const consumed = new Map(consGroups.map((g) => [`${g.unitId}|${g.productId}`, Math.max(0, -(g._sum.quantity ?? 0))]));

    const keys = new Set<string>([...stock.keys(), ...consumed.keys()]);
    for (const u of units) for (const p of alertProducts) keys.add(`${u.id}|${p.id}`);

    const unitNames = new Map(units.map((u) => [u.id, u.name]));
    const missingUnits = [...new Set([...keys].map((k) => k.split("|")[0]))].filter((id) => !unitNames.has(id));
    if (missingUnits.length) {
      const extra = await this.prisma.unit.findMany({ where: { id: { in: missingUnits } } });
      extra.forEach((u) => unitNames.set(u.id, u.name));
    }
    const productIds = [...new Set([...keys].map((k) => k.split("|")[1]))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      select: { id: true, name: true, sku: true, minStockAlert: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const rows: StockCoverageRow[] = [];
    for (const key of keys) {
      const [unitId, productId] = key.split("|");
      const product = productMap.get(productId);
      if (!product || !unitNames.has(unitId)) continue;
      const currentStock = stock.get(key) ?? 0;
      const total30 = consumed.get(key) ?? 0;
      const avg = total30 / COVERAGE_WINDOW_DAYS;
      const coverageDays = avg > 0 ? round2(currentStock / avg) : null;
      let status: CoverageStatus = "OK";
      if (currentStock <= 0) status = "RUPTURE";
      else if (coverageDays !== null && coverageDays <= CRITICAL_DAYS) status = "CRITICAL";
      else if (
        (product.minStockAlert > 0 && currentStock <= product.minStockAlert) ||
        (coverageDays !== null && coverageDays <= LOW_DAYS)
      ) {
        status = "LOW";
      }
      rows.push({
        productId,
        productName: product.name,
        productSku: product.sku,
        unitId,
        unitName: unitNames.get(unitId) as string,
        currentStock,
        minStockAlert: product.minStockAlert,
        avgDailyConsumption: round2(avg),
        coverageDays,
        status,
      });
    }
    const rank: Record<CoverageStatus, number> = { RUPTURE: 0, CRITICAL: 1, LOW: 2, OK: 3 };
    return rows.sort(
      (a, b) =>
        rank[a.status] - rank[b.status] ||
        (a.coverageDays ?? Infinity) - (b.coverageDays ?? Infinity) ||
        a.productName.localeCompare(b.productName),
    );
  }

  async losses(params: { unitId?: string; from: Date; to: Date }): Promise<LossReport> {
    const movements = await this.prisma.stockMovement.findMany({
      where: {
        type: { in: ["LOSS_EXPIRED", "LOSS_DAMAGE"] },
        createdAt: { gte: params.from, lte: params.to },
        ...(params.unitId ? { unitId: params.unitId } : {}),
      },
      include: {
        unit: { select: { name: true } },
        product: { select: { name: true, price: true } },
        batch: { select: { lotNumber: true, costPrice: true } },
        user: { select: { name: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    const rows: LossRow[] = movements.map((m) => {
      const quantity = Math.abs(m.quantity);
      const unitCost = Number(m.batch?.costPrice ?? m.product.price);
      return {
        movementId: m.id,
        createdAt: m.createdAt,
        unitId: m.unitId,
        unitName: m.unit.name,
        productId: m.productId,
        productName: m.product.name,
        lotNumber: m.batch?.lotNumber ?? null,
        type: m.type as LossRow["type"],
        quantity,
        value: round2(quantity * unitCost),
        reason: m.reason,
        document: m.document,
        userName: m.user.name,
      };
    });
    const byType = new Map<string, { quantity: number; value: number }>();
    for (const r of rows) {
      const cur = byType.get(r.type) ?? { quantity: 0, value: 0 };
      cur.quantity += r.quantity;
      cur.value += r.value;
      byType.set(r.type, cur);
    }
    return {
      rows,
      totalQuantity: rows.reduce((s, r) => s + r.quantity, 0),
      totalValue: round2(rows.reduce((s, r) => s + r.value, 0)),
      byType: [...byType].map(([type, v]) => ({ type, quantity: v.quantity, value: round2(v.value) })),
    };
  }

  async dispensationSummary(params: {
    unitId?: string;
    from: Date;
    to: Date;
    groupBy: "patient" | "prescriber";
  }): Promise<DispensationSummaryRow[]> {
    const rows = await this.prisma.dispensation.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: params.from, lte: params.to },
        ...(params.unitId ? { unitId: params.unitId } : {}),
      },
      select: {
        totalValue: true,
        patientId: true,
        patient: { select: { name: true } },
        prescription: {
          select: { prescriberName: true, prescriberCouncil: true, prescriberCouncilNumber: true },
        },
        items: { select: { quantity: true } },
      },
    });
    const map = new Map<string, DispensationSummaryRow>();
    for (const r of rows) {
      let key: string;
      let label: string;
      if (params.groupBy === "patient") {
        key = r.patientId ?? "none";
        label = r.patient?.name ?? "Sem paciente";
      } else if (r.prescription) {
        const p = r.prescription;
        key = `${p.prescriberCouncil}-${p.prescriberCouncilNumber}`;
        label = `${p.prescriberName} (${p.prescriberCouncil} ${p.prescriberCouncilNumber})`;
      } else {
        key = "none";
        label = "Sem receita";
      }
      const cur = map.get(key) ?? { key, label, dispensationCount: 0, itemQuantity: 0, totalValue: 0 };
      cur.dispensationCount += 1;
      cur.itemQuantity += r.items.reduce((s, i) => s + i.quantity, 0);
      cur.totalValue += Number(r.totalValue);
      map.set(key, cur);
    }
    return [...map.values()]
      .map((r) => ({ ...r, totalValue: round2(r.totalValue) }))
      .sort((a, b) => b.dispensationCount - a.dispensationCount);
  }

  async controlledLedger(params: {
    productId: string;
    unitId?: string;
    from?: Date;
    to?: Date;
  }): Promise<ControlledLedger | null> {
    const product = await this.prisma.product.findUnique({ where: { id: params.productId } });
    if (!product) return null;
    const scope: Prisma.StockMovementWhereInput = {
      productId: params.productId,
      ...(params.unitId ? { unitId: params.unitId } : {}),
    };
    const opening = params.from
      ? ((await this.prisma.stockMovement.aggregate({
          where: { ...scope, createdAt: { lt: params.from } },
          _sum: { quantity: true },
        }))._sum.quantity ?? 0)
      : 0;

    const movements = await this.prisma.stockMovement.findMany({
      where: {
        ...scope,
        ...(params.from || params.to
          ? {
              createdAt: {
                ...(params.from ? { gte: params.from } : {}),
                ...(params.to ? { lte: params.to } : {}),
              },
            }
          : {}),
      },
      include: {
        unit: { select: { name: true } },
        batch: { select: { lotNumber: true } },
        user: { select: { name: true } },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    const dispIds = [...new Set(movements.filter((m) => m.refType === "Dispensation" && m.refId).map((m) => m.refId as string))];
    const disps = dispIds.length
      ? await this.prisma.dispensation.findMany({
          where: { id: { in: dispIds } },
          include: {
            patient: { select: { name: true, cpf: true, cns: true } },
            prescription: true,
            pharmacist: { select: { name: true } },
          },
        })
      : [];
    const dispMap = new Map(disps.map((d) => [d.id, d]));

    let balance = opening;
    const entries: ControlledLedgerEntry[] = movements.map((m) => {
      balance += m.quantity;
      const d = m.refType === "Dispensation" && m.refId ? dispMap.get(m.refId) : undefined;
      return {
        movementId: m.id,
        createdAt: m.createdAt,
        type: m.type as StockMovementType,
        quantity: m.quantity,
        balance,
        unitName: m.unit.name,
        lotNumber: m.batch?.lotNumber ?? null,
        reason: m.reason,
        document: m.document,
        userName: m.user.name,
        dispensationId: d?.id ?? null,
        patientName: d?.patient?.name ?? null,
        patientCpf: d?.patient?.cpf ?? null,
        patientCns: d?.patient?.cns ?? null,
        prescriptionNumber: d?.prescription?.number ?? null,
        prescriberName: d?.prescription?.prescriberName ?? null,
        prescriberCouncil: d?.prescription?.prescriberCouncil ?? null,
        prescriberCouncilNumber: d?.prescription?.prescriberCouncilNumber ?? null,
        pharmacistName: d?.pharmacist?.name ?? null,
      };
    });

    return {
      productId: product.id,
      productName: product.name,
      controlledClass: product.controlledClass as ControlledClass,
      openingBalance: opening,
      closingBalance: balance,
      entries,
    };
  }

  async controlledBalance(params: { unitId?: string }): Promise<ControlledBalanceRow[]> {
    const controlled = { controlledClass: { not: "NONE" } };
    const [batches, ledger] = await Promise.all([
      this.prisma.batch.findMany({
        where: {
          ...(params.unitId ? { unitId: params.unitId } : {}),
          quantity: { gt: 0 },
          product: controlled,
        },
        include: { product: { select: { name: true, controlledClass: true } }, unit: { select: { name: true } } },
        orderBy: { expiresAt: "asc" },
      }),
      this.prisma.stockMovement.groupBy({
        by: ["unitId", "productId"],
        where: { ...(params.unitId ? { unitId: params.unitId } : {}), product: controlled },
        _sum: { quantity: true },
      }),
    ]);

    const map = new Map<string, ControlledBalanceRow>();
    for (const b of batches) {
      const key = `${b.unitId}|${b.productId}`;
      let r = map.get(key);
      if (!r) {
        r = {
          productId: b.productId,
          productName: b.product.name,
          controlledClass: b.product.controlledClass as ControlledClass,
          unitId: b.unitId,
          unitName: b.unit.name,
          batchTotal: 0,
          ledgerTotal: 0,
          divergence: 0,
          batches: [],
        };
        map.set(key, r);
      }
      r.batchTotal += b.quantity;
      r.batches.push({ batchId: b.id, lotNumber: b.lotNumber, expiresAt: b.expiresAt, quantity: b.quantity });
    }
    const missing = ledger.filter((g) => (g._sum.quantity ?? 0) !== 0 && !map.has(`${g.unitId}|${g.productId}`));
    if (missing.length) {
      const [prods, units] = await Promise.all([
        this.prisma.product.findMany({ where: { id: { in: missing.map((g) => g.productId) } } }),
        this.prisma.unit.findMany({ where: { id: { in: missing.map((g) => g.unitId) } } }),
      ]);
      const pm = new Map(prods.map((p) => [p.id, p]));
      const um = new Map(units.map((u) => [u.id, u]));
      for (const g of missing) {
        const p = pm.get(g.productId);
        const u = um.get(g.unitId);
        if (!p || !u) continue;
        map.set(`${g.unitId}|${g.productId}`, {
          productId: p.id,
          productName: p.name,
          controlledClass: p.controlledClass as ControlledClass,
          unitId: u.id,
          unitName: u.name,
          batchTotal: 0,
          ledgerTotal: 0,
          divergence: 0,
          batches: [],
        });
      }
    }
    for (const g of ledger) {
      const r = map.get(`${g.unitId}|${g.productId}`);
      if (r) r.ledgerTotal = g._sum.quantity ?? 0;
    }
    for (const r of map.values()) r.divergence = r.batchTotal - r.ledgerTotal;
    return [...map.values()].sort(
      (a, b) => a.productName.localeCompare(b.productName) || a.unitName.localeCompare(b.unitName),
    );
  }
}
