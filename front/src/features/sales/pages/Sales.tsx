import { useState } from "react";
import { Link } from "react-router-dom";
import { Topbar } from "@/design-system/layout/Topbar";
import { Card } from "@/design-system/ui/GlassCard";
import { Button } from "@/design-system/ui/Button";
import { Input } from "@/design-system/ui/Input";
import { Badge } from "@/design-system/ui/Badge";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/ui/Table";
import { EmptyState } from "@/design-system/ui/EmptyState";
import { ErrorState } from "@/design-system/ui/ErrorState";
import { Skeleton } from "@/design-system/ui/Skeleton";
import { salesApi, type SaleStatus } from "@/features/sales/api";
import { useCancelSale, useSale, useSales } from "@/features/sales/hooks";
import { SALE_STATUS_TABS, paymentLabel } from "@/features/sales/constants";
import { brl, dateBR } from "@/lib/utils";
import { Eye, Receipt, ShoppingBag } from "lucide-react";
import { SaleDetailModal } from "../components/SaleDetailModal";

export default function SalesPage() {
  const [tab, setTab] = useState<"todos" | SaleStatus>("todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);

  const filters = {
    status: tab !== "todos" ? tab : undefined,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
    page,
    pageSize: 15,
  };

  const list = useSales(filters);
  const detail = useSale(detailId);
  const cancelMut = useCancelSale();

  const pageCount = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <Topbar
        title="Vendas"
        tabs={SALE_STATUS_TABS.map((t) => ({ key: t.key, label: t.label }))}
        activeTab={tab}
        onTabChange={(k) => {
          const next = SALE_STATUS_TABS.find((t) => t.key === k);
          if (next) setTab(next.key);
          setPage(1);
        }}
        actions={
          <Button size="sm" asChild>
            <Link to="/pdv">
              <ShoppingBag className="size-4" /> Nova venda
            </Link>
          </Button>
        }
      />

      <Card className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1 grid grid-cols-2 gap-3 max-w-md">
          <div>
            <label className="text-xs font-medium text-ink-muted">De</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted">Até</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFrom("");
            setTo("");
            setPage(1);
          }}
        >
          Limpar
        </Button>
      </Card>

      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Data</Th>
              <Th>Vendedor</Th>
              <Th>Cliente</Th>
              <Th>Pagamento</Th>
              <Th className="text-right">Itens</Th>
              <Th>Status</Th>
              <Th className="text-right">Valor</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {list.isError ? (
              <Tr>
                <Td colSpan={8}>
                  <ErrorState error={list.error} onRetry={() => list.refetch()} />
                </Td>
              </Tr>
            ) : list.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Tr key={i}>
                  <Td colSpan={8}><Skeleton className="h-4" /></Td>
                </Tr>
              ))
            ) : list.data && list.data.data.length > 0 ? (
              list.data.data.map((s) => (
                <Tr key={s.id}>
                  <Td className="text-ink-muted whitespace-nowrap">{dateBR(s.createdAt)}</Td>
                  <Td className="font-medium">{s.userName}</Td>
                  <Td>{s.customerName ?? s.clientName}</Td>
                  <Td className="text-ink-muted">{paymentLabel(s.paymentMethod)}</Td>
                  <Td className="text-right">{s.itemCount}</Td>
                  <Td>
                    <Badge tone={s.status === "COMPLETED" ? "success" : "danger"} dot>
                      {s.status === "COMPLETED" ? "Concluída" : "Cancelada"}
                    </Badge>
                  </Td>
                  <Td className="text-right font-semibold">{brl(s.totalAmount)}</Td>
                  <Td className="text-right whitespace-nowrap">
                    <button
                      onClick={() => setDetailId(s.id)}
                      className="inline-flex items-center gap-1 text-brand-500 hover:underline text-xs font-medium mr-3"
                    >
                      <Eye className="size-3.5" /> Detalhes
                    </button>
                    <button
                      onClick={() => salesApi.openReceipt(s.id)}
                      className="inline-flex items-center gap-1 text-ink-muted hover:text-ink text-xs font-medium"
                    >
                      <Receipt className="size-3.5" /> Cupom
                    </button>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={8}>
                  <EmptyState title="Nenhuma venda encontrada nesse período." />
                </Td>
              </Tr>
            )}
          </tbody>
        </Table>
      </TableShell>

      <div className="flex items-center justify-between text-sm text-ink-muted">
        <span>Página {list.data?.page ?? 1} de {pageCount} · {list.data?.total ?? 0} venda(s)</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
            Próxima
          </Button>
        </div>
      </div>

      {detailId && (
        <SaleDetailModal
          onClose={() => setDetailId(null)}
          loading={detail.isLoading}
          detail={detail.data?.sale}
          onCancel={() => detailId && cancelMut.mutate(detailId)}
          canceling={cancelMut.isPending}
        />
      )}
    </div>
  );
}

