import { describe, expect, it } from "vitest";
import type { DashboardMetricsDTO } from "./api";
import { summarizeWeek } from "./utils";

const metrics = (days: { total: number; count: number }[]): DashboardMetricsDTO => ({
  today: { revenue: 0, salesCount: 0 },
  revenueLast7Days: days.map((d, i) => ({ date: `2026-01-0${i + 1}`, ...d })),
  latestSales: [],
  lowStockCount: 0,
  expiringSoonCount: 0,
});

describe("summarizeWeek", () => {
  it("soma receita e pedidos e calcula o ticket médio", () => {
    const week = summarizeWeek(
      metrics([
        { total: 100, count: 2 },
        { total: 50, count: 1 },
      ]),
    );
    expect(week).toEqual({ total: 150, count: 3, avgTicket: 50 });
  });

  it("não divide por zero sem vendas nem métricas", () => {
    expect(summarizeWeek(metrics([]))).toEqual({ total: 0, count: 0, avgTicket: 0 });
    expect(summarizeWeek(undefined)).toEqual({ total: 0, count: 0, avgTicket: 0 });
  });
});
