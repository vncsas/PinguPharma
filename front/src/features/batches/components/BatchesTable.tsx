import { Trash2 } from "lucide-react";
import { Badge } from "@/design-system/ui/Badge";
import { Chip } from "@/design-system/ui/Chip";
import { useConfirm } from "@/design-system/ui/ConfirmDialog";
import { EmptyState } from "@/design-system/ui/EmptyState";
import { ErrorState } from "@/design-system/ui/ErrorState";
import { Skeleton } from "@/design-system/ui/Skeleton";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/ui/Table";
import { brl, dateBR } from "@/lib/utils";
import { EXPIRING_FILTERS } from "../constants";
import { useDeleteBatch } from "../hooks";
import type { useBatches } from "../hooks";
import { daysUntil } from "../utils";

interface BatchesTableProps {
  batches: ReturnType<typeof useBatches>;
  filterExpiring: number | undefined;
  onFilterChange: (days: number | undefined) => void;
}

export function BatchesTable({ batches, filterExpiring, onFilterChange }: BatchesTableProps) {
  const confirm = useConfirm();
  const removeBatch = useDeleteBatch();
  const rows = batches.data?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink">Lotes ativos</h3>
          <p className="text-xs text-ink-muted">Ordenados por validade mais próxima</p>
        </div>
        <div className="flex gap-2">
          {EXPIRING_FILTERS.map((f) => (
            <Chip
              key={f.label}
              active={filterExpiring === f.days}
              onClick={() => onFilterChange(f.days)}
            >
              {f.label}
            </Chip>
          ))}
        </div>
      </div>

      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Produto</Th>
              <Th>Lote</Th>
              <Th className="text-right">Qtd</Th>
              <Th className="text-right">Custo un.</Th>
              <Th>Validade</Th>
              <Th>Status</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {batches.isError ? (
              <Tr>
                <Td colSpan={7}>
                  <ErrorState error={batches.error} onRetry={() => batches.refetch()} />
                </Td>
              </Tr>
            ) : batches.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Tr key={i}>
                  <Td colSpan={7}>
                    <Skeleton className="h-4" />
                  </Td>
                </Tr>
              ))
            ) : rows.length === 0 ? (
              <Tr>
                <Td colSpan={7}>
                  <EmptyState title="Nenhum lote no filtro atual." />
                </Td>
              </Tr>
            ) : (
              rows.map((b) => {
                const days = daysUntil(b.expiresAt);
                return (
                  <Tr key={b.id}>
                    <Td>
                      <p className="text-sm font-medium">{b.productName}</p>
                      <p className="text-xs text-ink-muted font-mono">{b.productSku}</p>
                    </Td>
                    <Td className="font-mono text-xs">{b.lotNumber}</Td>
                    <Td className="text-right font-semibold">{b.quantity}</Td>
                    <Td className="text-right">{brl(b.costPrice)}</Td>
                    <Td className="text-sm text-ink-muted">{dateBR(b.expiresAt)}</Td>
                    <Td>
                      {days < 0 ? (
                        <Badge tone="danger" dot>
                          Vencido
                        </Badge>
                      ) : days <= 30 ? (
                        <Badge tone="warn" dot>
                          {days} dias
                        </Badge>
                      ) : (
                        <Badge tone="success" dot>
                          {days} dias
                        </Badge>
                      )}
                    </Td>
                    <Td className="text-right">
                      {b.quantity === 0 ? (
                        <button
                          onClick={async () => {
                            const ok = await confirm({
                              title: "Excluir lote vazio?",
                              confirmLabel: "Excluir",
                              danger: true,
                            });
                            if (ok) removeBatch.mutate(b.id);
                          }}
                          className="text-xs font-medium text-accent-rose hover:underline"
                        >
                          <Trash2 className="inline size-3.5" /> Excluir
                        </button>
                      ) : (
                        <span className="text-xs text-ink-subtle">com estoque</span>
                      )}
                    </Td>
                  </Tr>
                );
              })
            )}
          </tbody>
        </Table>
      </TableShell>
    </div>
  );
}
