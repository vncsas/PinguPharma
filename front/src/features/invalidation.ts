import type { QueryClient } from "@tanstack/react-query";
import { batchKeys } from "./batches/keys";
import { dashboardKeys } from "./dashboard/keys";
import { productKeys } from "./products/keys";

/**
 * Tudo que depende do saldo de estoque: produtos (totalStock), lotes e métricas do dashboard.
 * Usado por qualquer operação que mexe em estoque (venda, cancelamento, entrada/remoção de lote).
 */
export function invalidateStock(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: productKeys.all }),
    qc.invalidateQueries({ queryKey: batchKeys.all }),
    qc.invalidateQueries({ queryKey: dashboardKeys.all }),
  ]);
}
