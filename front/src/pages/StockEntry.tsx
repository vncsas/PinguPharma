import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Field, Input, Label } from "@/design-system/components/Input";
import { Badge } from "@/design-system/components/Badge";
import { StatCard } from "@/design-system/components/StatCard";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/components/Table";
import { Skeleton } from "@/design-system/components/Skeleton";
import { batchesApi } from "@/features/batches/api";
import { productsApi, type ProductDTO } from "@/features/products/api";
import { brl, dateBR } from "@/lib/utils";
import {
  CalendarClock,
  PackageCheck,
  PackagePlus,
  Package,
  Search,
  Trash2,
} from "lucide-react";

export default function StockEntryPage() {
  const qc = useQueryClient();
  const [productSearch, setProductSearch] = useState("");
  const [selected, setSelected] = useState<ProductDTO | null>(null);
  const [lot, setLot] = useState("");
  const [qty, setQty] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [exp, setExp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filterExpiring, setFilterExpiring] = useState<number | undefined>(undefined);

  const products = useQuery({
    queryKey: ["products-picker", productSearch],
    queryFn: () => productsApi.list({ search: productSearch, active: true, pageSize: 8 }),
    enabled: productSearch.length >= 1,
  });

  const batches = useQuery({
    queryKey: ["batches", filterExpiring],
    queryFn: () => batchesApi.list({ expiringWithinDays: filterExpiring, pageSize: 50 }),
  });

  const kpis = useMemo(() => {
    const rows = batches.data?.data ?? [];
    return {
      total: rows.length,
      units: rows.reduce((s, r) => s + r.quantity, 0),
      expiringSoon: rows.filter(
        (r) => new Date(r.expiresAt).getTime() - Date.now() < 30 * 24 * 3600 * 1000,
      ).length,
    };
  }, [batches.data]);

  const createMut = useMutation({
    mutationFn: () =>
      batchesApi.create({
        productId: selected!.id,
        lotNumber: lot,
        quantity: qty,
        costPrice: cost,
        expiresAt: new Date(exp).toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batches"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      setLot("");
      setQty(0);
      setCost(0);
      setExp("");
    },
    onError: (err: any) => setError(err.message ?? "Erro ao registrar lote"),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => batchesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["batches"] }),
  });

  return (
    <div className="space-y-6">
      <Topbar title="Entrada de estoque" />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Lotes ativos" value={String(kpis.total)} icon={<Package className="size-4" />} />
        <StatCard label="Unidades em estoque" value={String(kpis.units)} icon={<PackageCheck className="size-4" />} />
        <StatCard
          label="Vencendo em 30d"
          value={String(kpis.expiringSoon)}
          delta="atenção"
          deltaTone="down"
          icon={<CalendarClock className="size-4" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
        <Card className="space-y-5">
          <div>
            <h2 className="text-base font-semibold text-ink">Registrar novo lote</h2>
            <p className="text-xs text-ink-muted">
              Selecione o produto, informe lote/quantidade/custo/validade.
            </p>
          </div>

          <Field>
            <Label>Produto</Label>
            {selected ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-50/60 border border-brand-100">
                <div className="grid size-9 place-items-center rounded-lg bg-brand-500 text-white">
                  <Package className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{selected.name}</p>
                  <p className="text-xs text-ink-muted">
                    SKU {selected.sku} · estoque atual {selected.totalStock}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-ink-muted hover:text-ink"
                >
                  Trocar
                </button>
              </div>
            ) : (
              <>
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar por nome ou SKU"
                  leadingIcon={<Search className="size-4" />}
                />
                {productSearch && products.data && (
                  <div className="border border-line rounded-lg divide-y divide-line max-h-56 overflow-y-auto scrollbar-thin">
                    {products.data.data.length === 0 && (
                      <p className="p-3 text-sm text-ink-muted">Nenhum produto encontrado.</p>
                    )}
                    {products.data.data.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelected(p);
                          setProductSearch("");
                        }}
                        className="w-full text-left p-3 hover:bg-surface-alt transition-colors"
                      >
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-ink-muted">
                          SKU {p.sku} · estoque {p.totalStock}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </Field>

          <div className="grid md:grid-cols-2 gap-4">
            <Field>
              <Label>Número do lote</Label>
              <Input
                value={lot}
                onChange={(e) => setLot(e.target.value.toUpperCase())}
                placeholder="Ex: L2026-1234"
              />
            </Field>
            <Field>
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
            </Field>
            <Field>
              <Label>Preço de custo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
              />
            </Field>
            <Field>
              <Label>Validade</Label>
              <Input type="date" value={exp} onChange={(e) => setExp(e.target.value)} />
            </Field>
          </div>

          {error && (
            <div className="text-sm text-accent-rose bg-accent-rose/5 border border-accent-rose/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => {
                setError(null);
                createMut.mutate();
              }}
              disabled={
                createMut.isPending || !selected || !lot || qty <= 0 || cost < 0 || !exp
              }
            >
              <PackagePlus className="size-4" />
              {createMut.isPending ? "Registrando..." : "Registrar lote"}
            </Button>
          </div>
        </Card>

        <Card className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-ink">Cheat-sheet</h2>
            <p className="text-xs text-ink-muted">Como funciona a baixa por lote</p>
          </div>
          <ul className="space-y-3 text-sm text-ink-muted">
            <Bullet>
              <strong>PDV consome pelo FIFO</strong> — sempre o lote com validade mais próxima sai primeiro.
            </Bullet>
            <Bullet>
              Cancelar venda <strong>estorna a quantidade</strong> exata dos lotes originais.
            </Bullet>
            <Bullet>
              Lotes com quantidade 0 podem ser removidos manualmente. Com estoque, não podem.
            </Bullet>
            <Bullet>
              Alertas de validade rodam <strong>por lote com quantidade &gt; 0</strong> em até 30 dias.
            </Bullet>
          </ul>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-ink">Lotes ativos</h3>
            <p className="text-xs text-ink-muted">Ordenados por validade mais próxima</p>
          </div>
          <div className="flex gap-2">
            {[
              { label: "Todos", d: undefined },
              { label: "≤ 7d", d: 7 },
              { label: "≤ 30d", d: 30 },
              { label: "≤ 90d", d: 90 },
            ].map((f) => (
              <button
                key={f.label}
                onClick={() => setFilterExpiring(f.d)}
                className={`h-8 px-3 text-xs font-medium rounded-lg border ${
                  filterExpiring === f.d
                    ? "bg-brand-500 text-white border-brand-500"
                    : "bg-white text-ink border-line-strong hover:bg-surface-alt"
                }`}
              >
                {f.label}
              </button>
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
              {batches.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Tr key={i}><Td colSpan={7}><Skeleton className="h-4" /></Td></Tr>
                ))
              ) : (batches.data?.data.length ?? 0) === 0 ? (
                <Tr>
                  <Td colSpan={7} className="text-center text-ink-muted py-12">
                    Nenhum lote no filtro atual.
                  </Td>
                </Tr>
              ) : (
                batches.data!.data.map((b) => {
                  const days = Math.floor(
                    (new Date(b.expiresAt).getTime() - Date.now()) / (24 * 3600 * 1000),
                  );
                  const soon = days <= 30;
                  const expired = days < 0;
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
                        {expired ? (
                          <Badge tone="danger" dot>Vencido</Badge>
                        ) : soon ? (
                          <Badge tone="warn" dot>{days} dias</Badge>
                        ) : (
                          <Badge tone="success" dot>{days} dias</Badge>
                        )}
                      </Td>
                      <Td className="text-right">
                        {b.quantity === 0 ? (
                          <button
                            onClick={() => {
                              if (confirm("Excluir lote vazio?")) removeMut.mutate(b.id);
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
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 size-1.5 rounded-full bg-brand-500 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
