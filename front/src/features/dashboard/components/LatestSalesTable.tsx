import { Badge } from "@/design-system/ui/Badge";
import { Skeleton } from "@/design-system/ui/Skeleton";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/ui/Table";
import { brl, dateBR } from "@/lib/utils";
import type { DashboardMetricsDTO } from "../api";

export function LatestSalesTable({
  rows,
  isLoading,
}: {
  rows?: DashboardMetricsDTO["latestSales"];
  isLoading: boolean;
}) {
  return (
    <TableShell>
      <Table>
        <thead>
          <tr>
            <Th>Data</Th>
            <Th>Vendedor</Th>
            <Th>Cliente</Th>
            <Th>Status</Th>
            <Th className="text-right">Valor</Th>
          </tr>
        </thead>
        <tbody>
          {isLoading || !rows ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Tr key={i}>
                <Td colSpan={5}>
                  <Skeleton className="h-4" />
                </Td>
              </Tr>
            ))
          ) : rows.length === 0 ? (
            <Tr>
              <Td colSpan={5} className="text-center text-ink-muted py-8">
                Nenhuma venda registrada.
              </Td>
            </Tr>
          ) : (
            rows.map((s) => (
              <Tr key={s.id}>
                <Td className="text-ink-muted whitespace-nowrap">{dateBR(s.createdAt)}</Td>
                <Td className="font-medium">{s.userName}</Td>
                <Td>{s.clientName}</Td>
                <Td>
                  <Badge tone={s.status === "COMPLETED" ? "success" : "danger"} dot>
                    {s.status === "COMPLETED" ? "Concluída" : "Cancelada"}
                  </Badge>
                </Td>
                <Td className="text-right font-semibold">{brl(s.totalAmount)}</Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </TableShell>
  );
}
