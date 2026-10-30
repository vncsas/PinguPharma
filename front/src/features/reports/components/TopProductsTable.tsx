import { Skeleton } from "@/design-system/ui/Skeleton";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/ui/Table";
import { brl } from "@/lib/utils";
import type { FinancialReportDTO } from "../api";

export function TopProductsTable({
  report,
  isLoading,
}: {
  report: FinancialReportDTO | undefined;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold text-ink">Top produtos por receita</h3>
      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Produto</Th>
              <Th className="text-right">Qtd</Th>
              <Th className="text-right">Receita</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading || !report ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Tr key={i}>
                  <Td colSpan={3}>
                    <Skeleton className="h-4" />
                  </Td>
                </Tr>
              ))
            ) : report.topProducts.length === 0 ? (
              <Tr>
                <Td colSpan={3} className="text-center text-ink-muted py-8">
                  Sem dados
                </Td>
              </Tr>
            ) : (
              report.topProducts.map((p) => (
                <Tr key={p.productId}>
                  <Td>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-ink-muted font-mono">{p.sku}</p>
                  </Td>
                  <Td className="text-right">{p.quantity}</Td>
                  <Td className="text-right font-semibold">{brl(p.revenue)}</Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </TableShell>
    </div>
  );
}
