import { Skeleton } from "@/design-system/ui/Skeleton";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/ui/Table";
import { brl } from "@/lib/utils";
import type { FinancialReportDTO } from "../api";

export function TopSellersTable({
  report,
  isLoading,
}: {
  report: FinancialReportDTO | undefined;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold text-ink">Vendedores</h3>
      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Vendedor</Th>
              <Th className="text-right">Pedidos</Th>
              <Th className="text-right">Faturamento</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading || !report ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Tr key={i}>
                  <Td colSpan={3}>
                    <Skeleton className="h-4" />
                  </Td>
                </Tr>
              ))
            ) : report.topSellers.length === 0 ? (
              <Tr>
                <Td colSpan={3} className="text-center text-ink-muted py-8">
                  Sem dados
                </Td>
              </Tr>
            ) : (
              report.topSellers.map((s) => (
                <Tr key={s.userId}>
                  <Td className="font-medium">{s.name}</Td>
                  <Td className="text-right">{s.count}</Td>
                  <Td className="text-right font-semibold">{brl(s.total)}</Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </TableShell>
    </div>
  );
}
