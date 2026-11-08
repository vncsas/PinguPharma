import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { batchKeys } from "./batches/keys";
import { customerKeys } from "./customers/keys";
import { dashboardKeys } from "./dashboard/keys";
import { invalidateStock } from "./invalidation";
import { productKeys } from "./products/keys";
import { saleKeys } from "./sales/keys";

function seeded() {
  const qc = new QueryClient();
  const keys = {
    productList: productKeys.list({ search: "x" }),
    productDetail: productKeys.detail("1"),
    batches: batchKeys.list({}),
    dashboard: dashboardKeys.metrics(),
    sales: saleKeys.list({}),
    customers: customerKeys.list(""),
  };
  Object.values(keys).forEach((k) => qc.setQueryData(k, {}));
  const stale = (k: readonly unknown[]) => qc.getQueryState(k)?.isInvalidated;
  return { qc, keys, stale };
}

describe("invalidateStock", () => {
  it("invalida produtos (lista e detalhe), lotes e dashboard", async () => {
    const { qc, keys, stale } = seeded();
    await invalidateStock(qc);

    expect(stale(keys.productList)).toBe(true);
    expect(stale(keys.productDetail)).toBe(true);
    expect(stale(keys.batches)).toBe(true);
    expect(stale(keys.dashboard)).toBe(true);
  });

  it("não toca em vendas nem clientes", async () => {
    const { qc, keys, stale } = seeded();
    await invalidateStock(qc);

    expect(stale(keys.sales)).toBe(false);
    expect(stale(keys.customers)).toBe(false);
  });
});

describe("query keys", () => {
  it("chaves de listagem compartilham o prefixo do domínio", () => {
    expect(productKeys.list({}).slice(0, 1)).toEqual(productKeys.all);
    expect(saleKeys.detail("1").slice(0, 1)).toEqual(saleKeys.all);
  });
});
