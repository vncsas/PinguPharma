import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Input } from "@/design-system/components/Input";
import { Badge } from "@/design-system/components/Badge";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/components/Table";
import { Skeleton } from "@/design-system/components/Skeleton";
import { salesApi, type SaleStatus } from "@/features/sales/api";
import { brl, dateBR } from "@/lib/utils";
import {
  Ban,
  Eye,
  Receipt,
  ShoppingBag,
  X,
} from "lucide-react";

const TABS: { key: SaleStatus | "todos"; label: string }[] = [
  { key: "todos", label: "Todas" },
  { key: "COMPLETED", label: "Concluídas" },
  { key: "CANCELED", label: "Canceladas" },
];

export default function SalesPage() {
  const [tab, setTab] = useState<"todos" | SaleStatus>("todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const qc = useQueryClient();

  const filters = {
    status: tab !== "todos" ? tab : undefined,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
    page,
    pageSize: 15,
  };

  const list = useQuery({
    queryKey: ["sales", filters],
    queryFn: () => salesApi.list(filters),
  });

  const detail = useQuery({
    queryKey: ["sale", detailId],
    queryFn: () => salesApi.get(detailId!),
    enabled: !!detailId,
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => salesApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      if (detailId) qc.invalidateQueries({ queryKey: ["sale", detailId] });
    },
  });

  const pageCount = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <Topbar
        title="Vendas"
        tabs={TABS.map((t) => ({ key: t.key, label: t.label }))}
        activeTab={tab}
        onTabChange={(k) => {
          setTab(k as any);
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
            {list.isLoading ? (
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
                <Td colSpan={8} className="text-center text-ink-muted py-12">
                  Nenhuma venda encontrada nesse período.
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

function paymentLabel(p: string) {
  return (
    {
      CASH: "Dinheiro",
      CREDIT: "Crédito",
      DEBIT: "Débito",
      PIX: "PIX",
      OTHER: "Outro",
    } as Record<string, string>
  )[p] ?? p;
}

function SaleDetailModal({
  onClose,
  loading,
  detail,
  onCancel,
  canceling,
}: {
  onClose: () => void;
  loading: boolean;
  detail: any;
  onCancel: () => void;
  canceling: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 backdrop-blur-sm p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin !p-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div>
            <h3 className="text-base font-semibold text-ink">Detalhes da venda</h3>
            <p className="text-xs text-ink-muted">
              {detail ? `#${String(detail.id).slice(-8).toUpperCase()}` : "Carregando..."}
            </p>
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded hover:bg-surface-alt">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading || !detail ? (
            <Skeleton className="h-40" />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <Field label="Data" value={dateBR(detail.createdAt)} />
                <Field label="Vendedor" value={detail.userName} />
                <Field label="Cliente" value={detail.customerName ?? detail.clientName} />
                <Field label="Pagamento" value={paymentLabel(detail.paymentMethod)} />
                <Field label="Itens" value={String(detail.items.length)} />
                <Field
                  label="Status"
                  value={
                    <Badge tone={detail.status === "COMPLETED" ? "success" : "danger"} dot>
                      {detail.status === "COMPLETED" ? "Concluída" : "Cancelada"}
                    </Badge>
                  }
                />
              </div>

              <div>
                <p className="text-xs font-medium text-ink-muted mb-2">Itens</p>
                <div className="border border-line rounded-lg divide-y divide-line">
                  {detail.items.map((i: any) => (
                    <div key={i.id} className="flex items-center gap-3 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{i.productName}</p>
                        <p className="text-xs text-ink-muted">
                          SKU {i.productSku}
                          {i.lotNumber && <> · Lote <span className="font-mono">{i.lotNumber}</span></>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {i.quantity}x {brl(i.unitPrice)}
                        </p>
                        <p className="text-xs font-semibold">{brl(i.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-surface-alt">
                <span className="text-sm text-ink-muted">Total</span>
                <span className="text-2xl font-semibold">{brl(detail.totalAmount)}</span>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => salesApi.openReceipt(detail.id)}>
                  <Receipt className="size-4" /> Abrir cupom
                </Button>
                {detail.status === "COMPLETED" && (
                  <Button
                    variant="danger"
                    disabled={canceling}
                    onClick={() => {
                      if (confirm("Cancelar venda? Estoque será estornado por lote.")) onCancel();
                    }}
                  >
                    <Ban className="size-4" />
                    {canceling ? "Cancelando..." : "Cancelar venda"}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">{label}</p>
      <div className="text-sm text-ink mt-0.5">{value}</div>
    </div>
  );
}
