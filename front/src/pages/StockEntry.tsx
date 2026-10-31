import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Field, Input, Label } from "@/design-system/components/Input";
import { Badge } from "@/design-system/components/Badge";
import { Modal } from "@/design-system/components/Modal";
import { StatCard } from "@/design-system/components/StatCard";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/components/Table";
import { Skeleton } from "@/design-system/components/Skeleton";
import { Pagination } from "@/design-system/components/Pagination";
import { UnitRequiredNotice } from "@/design-system/components/UnitRequiredNotice";
import { useToast } from "@/design-system/components/Toast";
import { useConfirm } from "@/design-system/components/ConfirmDialog";
import { batchesApi, type BatchDTO } from "@/features/batches/api";
import { productsApi, type ProductDTO } from "@/features/products/api";
import { suppliersApi } from "@/features/suppliers/api";
import { MOVEMENT_LABEL, stockApi, type StockMovementType } from "@/features/stock/api";
import { useAuth } from "@/lib/auth-context";
import { useUnit } from "@/lib/unit-context";
import { MANAGER_ROLES } from "@/lib/roles";
import { brl, dateBR, dayBR, errMsg } from "@/lib/utils";
import {
  CalendarClock,
  PackageCheck,
  PackagePlus,
  Package,
  Search,
  Trash2,
} from "lucide-react";

const TABS = [
  { key: "lotes", label: "Lotes e entradas" },
  { key: "movimentacoes", label: "Movimentações" },
];

function invalidateStock(qc: ReturnType<typeof useQueryClient>) {
  for (const key of ["batches", "products", "stock-movements", "dashboard-metrics"]) {
    qc.invalidateQueries({ queryKey: [key] });
  }
}

export default function StockEntryPage() {
  const [tab, setTab] = useState("lotes");
  return (
    <div className="space-y-6">
      <Topbar title="Estoque" tabs={TABS} activeTab={tab} onTabChange={setTab} />
      {tab === "lotes" ? <BatchesView /> : <MovementsView />}
    </div>
  );
}

// ---------- Lotes e entradas ----------

function BatchesView() {
  const confirm = useConfirm();
  const toast = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { needsUnit } = useUnit();
  const canSeeSuppliers = !!user && MANAGER_ROLES.includes(user.role);

  const [productSearch, setProductSearch] = useState("");
  const [selected, setSelected] = useState<ProductDTO | null>(null);
  const [lot, setLot] = useState("");
  const [qty, setQty] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [exp, setExp] = useState("");
  const [entryType, setEntryType] = useState<"ENTRY_PURCHASE" | "ENTRY_DONATION">("ENTRY_PURCHASE");
  const [supplierId, setSupplierId] = useState("");
  const [document, setDocument] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filterExpiring, setFilterExpiring] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [lossBatch, setLossBatch] = useState<BatchDTO | null>(null);
  const [adjustBatch, setAdjustBatch] = useState<BatchDTO | null>(null);

  const products = useQuery({
    queryKey: ["products", "picker", productSearch],
    queryFn: () => productsApi.list({ search: productSearch, active: true, pageSize: 8 }),
    enabled: productSearch.length >= 1,
  });

  const suppliers = useQuery({
    queryKey: ["suppliers", "active"],
    queryFn: () => suppliersApi.list({ activeOnly: true }),
    enabled: canSeeSuppliers,
  });

  const batches = useQuery({
    queryKey: ["batches", filterExpiring, page],
    queryFn: () => batchesApi.list({ expiringWithinDays: filterExpiring, page, pageSize: 15 }),
  });

  const kpis = useMemo(() => {
    const rows = batches.data?.data ?? [];
    return {
      total: batches.data?.total ?? 0,
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
        expiresAt: new Date(`${exp}T12:00:00`).toISOString(),
        entryType,
        supplierId: supplierId || null,
        document: document.trim() || null,
      }),
    onSuccess: () => {
      invalidateStock(qc);
      toast.success("Entrada registrada", `Lote ${lot} adicionado ao estoque.`);
      setLot("");
      setQty(0);
      setCost(0);
      setExp("");
      setDocument("");
      setSupplierId("");
    },
    onError: (err) => setError(errMsg(err, "Erro ao registrar a entrada")),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => batchesApi.remove(id),
    onSuccess: () => {
      invalidateStock(qc);
      toast.success("Lote excluído");
    },
    onError: (err) => toast.error("Não foi possível excluir", errMsg(err)),
  });

  return (
    <>
      <UnitRequiredNotice action="registrar entradas, perdas e ajustes" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Lotes ativos" value={String(kpis.total)} icon={<Package className="size-4" />} />
        <StatCard label="Unidades nesta página" value={String(kpis.units)} icon={<PackageCheck className="size-4" />} />
        <StatCard
          label="Vencendo em 30d (nesta página)"
          value={String(kpis.expiringSoon)}
          delta="atenção"
          deltaTone="down"
          icon={<CalendarClock className="size-4" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
        <Card className="space-y-5">
          <div>
            <h2 className="text-base font-semibold text-ink">Registrar entrada de lote</h2>
            <p className="text-xs text-ink-muted">
              Informe o produto, a origem, o documento (nota fiscal ou empenho), lote, quantidade e validade.
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
                    {selected.presentation ?? selected.sku} · estoque atual {selected.totalStock}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="text-xs text-ink-muted hover:text-ink">
                  Trocar
                </button>
              </div>
            ) : (
              <>
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar por nome, código ou princípio ativo"
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
                          {p.presentation ?? p.sku} · estoque {p.totalStock}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </Field>

          <Field>
            <Label>Tipo de entrada</Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["ENTRY_PURCHASE", "Compra / licitação"],
                  ["ENTRY_DONATION", "Doação"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEntryType(key)}
                  className={`h-10 rounded-lg text-sm font-medium border ${
                    entryType === key
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-white text-ink border-line-strong hover:bg-surface-alt"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid md:grid-cols-2 gap-4">
            <Field>
              <Label>Fornecedor</Label>
              {canSeeSuppliers ? (
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm outline-none focus:border-brand-500"
                >
                  <option value="">Não informado</option>
                  {suppliers.data?.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-ink-muted pt-2">A escolha do fornecedor é feita pelo gestor da unidade.</p>
              )}
            </Field>
            <Field>
              <Label>Documento (nota fiscal / empenho)</Label>
              <Input value={document} onChange={(e) => setDocument(e.target.value)} maxLength={60} />
            </Field>
            <Field>
              <Label>Número do lote</Label>
              <Input value={lot} onChange={(e) => setLot(e.target.value.toUpperCase())} placeholder="Ex: L2026-1234" />
            </Field>
            <Field>
              <Label>Quantidade</Label>
              <Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </Field>
            <Field>
              <Label>Valor unitário (R$)</Label>
              <Input type="number" step="0.01" min={0} value={cost} onChange={(e) => setCost(Number(e.target.value))} />
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
              disabled={createMut.isPending || needsUnit || !selected || !lot || qty <= 0 || cost < 0 || !exp}
            >
              <PackagePlus className="size-4" />
              {createMut.isPending ? "Registrando..." : "Registrar entrada"}
            </Button>
          </div>
        </Card>

        <Card className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-ink">Como funciona</h2>
            <p className="text-xs text-ink-muted">Regras de baixa e rastreabilidade</p>
          </div>
          <ul className="space-y-3 text-sm text-ink-muted">
            <Bullet><strong>A dispensação baixa pelo FEFO</strong>: sai primeiro o lote com validade mais próxima.</Bullet>
            <Bullet>Cancelar uma dispensação <strong>devolve a quantidade</strong> aos lotes originais.</Bullet>
            <Bullet>Perdas (vencimento ou avaria) e ajustes de inventário exigem <strong>motivo</strong> e ficam na aba Movimentações.</Bullet>
            <Bullet>Lotes com quantidade 0 podem ser removidos. Com estoque, use perda ou ajuste.</Bullet>
          </ul>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
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
                onClick={() => {
                  setFilterExpiring(f.d);
                  setPage(1);
                }}
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
                <Th>Unidade</Th>
                <Th>Lote</Th>
                <Th>Origem</Th>
                <Th className="text-right">Qtd</Th>
                <Th className="text-right">Valor un.</Th>
                <Th>Validade</Th>
                <Th>Situação</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {batches.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Tr key={i}><Td colSpan={9}><Skeleton className="h-4" /></Td></Tr>
                ))
              ) : batches.isError ? (
                <Tr><Td colSpan={9} className="text-center text-accent-rose py-12">Não foi possível carregar os lotes.</Td></Tr>
              ) : (batches.data?.data.length ?? 0) === 0 ? (
                <Tr><Td colSpan={9} className="text-center text-ink-muted py-12">Nenhum lote no filtro atual.</Td></Tr>
              ) : (
                batches.data!.data.map((b) => {
                  const days = Math.floor((new Date(b.expiresAt).getTime() - Date.now()) / (24 * 3600 * 1000));
                  return (
                    <Tr key={b.id}>
                      <Td>
                        <p className="text-sm font-medium">{b.productName}</p>
                        <p className="text-xs text-ink-muted font-mono">{b.productSku}</p>
                      </Td>
                      <Td className="text-ink-muted">{b.unitName}</Td>
                      <Td className="font-mono text-xs">{b.lotNumber}</Td>
                      <Td className="text-xs text-ink-muted">
                        {b.entryType ? MOVEMENT_LABEL[b.entryType] : "—"}
                        {b.supplierName && <p>{b.supplierName}</p>}
                        {b.document && <p>Doc. {b.document}</p>}
                      </Td>
                      <Td className="text-right font-semibold">{b.quantity}</Td>
                      <Td className="text-right">{brl(b.costPrice)}</Td>
                      <Td className="text-sm text-ink-muted">{dayBR(b.expiresAt)}</Td>
                      <Td>
                        {days < 0 ? (
                          <Badge tone="danger" dot>Vencido</Badge>
                        ) : days <= 30 ? (
                          <Badge tone="warn" dot>{days} dias</Badge>
                        ) : (
                          <Badge tone="success" dot>{days} dias</Badge>
                        )}
                      </Td>
                      <Td className="text-right whitespace-nowrap">
                        {b.quantity === 0 ? (
                          <button
                            onClick={async () => {
                              if (await confirm({ title: "Excluir lote vazio?", confirmLabel: "Excluir", tone: "danger" }))
                                removeMut.mutate(b.id);
                            }}
                            className="text-xs font-medium text-accent-rose hover:underline"
                          >
                            <Trash2 className="inline size-3.5" /> Excluir
                          </button>
                        ) : (
                          <>
                            <button
                              disabled={needsUnit}
                              title={needsUnit ? "Selecione uma unidade" : undefined}
                              onClick={() => setLossBatch(b)}
                              className="text-xs font-medium text-accent-rose hover:underline mr-3 disabled:opacity-40 disabled:no-underline"
                            >
                              Perda
                            </button>
                            <button
                              disabled={needsUnit}
                              title={needsUnit ? "Selecione uma unidade" : undefined}
                              onClick={() => setAdjustBatch(b)}
                              className="text-xs font-medium text-brand-500 hover:underline disabled:opacity-40 disabled:no-underline"
                            >
                              Ajuste
                            </button>
                          </>
                        )}
                      </Td>
                    </Tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </TableShell>

        <Pagination
          page={batches.data?.page ?? page}
          pageSize={batches.data?.pageSize ?? 15}
          total={batches.data?.total ?? 0}
          onPageChange={setPage}
          noun="lote(s)"
        />
      </div>

      {lossBatch && <LossModal batch={lossBatch} onClose={() => setLossBatch(null)} />}
      {adjustBatch && <AdjustModal batch={adjustBatch} onClose={() => setAdjustBatch(null)} />}
    </>
  );
}

function LossModal({ batch, onClose }: { batch: BatchDTO; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [type, setType] = useState<"LOSS_EXPIRED" | "LOSS_DAMAGE">(
    new Date(batch.expiresAt).getTime() < Date.now() ? "LOSS_EXPIRED" : "LOSS_DAMAGE",
  );
  const [quantity, setQuantity] = useState(batch.quantity);
  const [reason, setReason] = useState("");
  const [document, setDocument] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      stockApi.registerLoss({
        batchId: batch.id,
        quantity,
        type,
        reason: reason.trim(),
        document: document.trim() || null,
      }),
    onSuccess: () => {
      invalidateStock(qc);
      toast.success("Perda registrada");
      onClose();
    },
    onError: (err) => setError(errMsg(err)),
  });

  const invalid = quantity <= 0 || quantity > batch.quantity || reason.trim().length < 3;

  return (
    <Modal
      title="Registrar perda"
      description={`${batch.productName} · lote ${batch.lotNumber} · saldo ${batch.quantity}`}
      onClose={onClose}
    >
      <Field>
        <Label>Tipo de perda</Label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["LOSS_EXPIRED", "Vencimento"],
              ["LOSS_DAMAGE", "Avaria"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setType(key)}
              className={`h-10 rounded-lg text-sm font-medium border ${
                type === key ? "bg-brand-500 text-white border-brand-500" : "bg-white text-ink border-line-strong hover:bg-surface-alt"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>
      <Field>
        <Label>Quantidade perdida</Label>
        <Input type="number" min={1} max={batch.quantity} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        {quantity > batch.quantity && <p className="text-xs text-accent-rose pl-1">Maior que o saldo do lote.</p>}
      </Field>
      <Field>
        <Label>Motivo (obrigatório)</Label>
        <textarea
          rows={3}
          maxLength={300}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
        />
      </Field>
      <Field>
        <Label>Documento (opcional)</Label>
        <Input value={document} onChange={(e) => setDocument(e.target.value)} maxLength={60} />
      </Field>
      {error && <p className="text-sm text-accent-rose">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          variant="danger"
          disabled={mut.isPending || invalid}
          onClick={() => {
            setError(null);
            mut.mutate();
          }}
        >
          {mut.isPending ? "Registrando..." : "Registrar perda"}
        </Button>
      </div>
    </Modal>
  );
}

function AdjustModal({ batch, onClose }: { batch: BatchDTO; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [newQuantity, setNewQuantity] = useState(batch.quantity);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => stockApi.registerAdjustment({ batchId: batch.id, newQuantity, reason: reason.trim() }),
    onSuccess: () => {
      invalidateStock(qc);
      toast.success("Ajuste registrado");
      onClose();
    },
    onError: (err) => setError(errMsg(err)),
  });

  const diff = newQuantity - batch.quantity;
  const invalid = newQuantity < 0 || diff === 0 || reason.trim().length < 3;

  return (
    <Modal
      title="Ajuste de inventário"
      description={`${batch.productName} · lote ${batch.lotNumber} · saldo atual ${batch.quantity}`}
      onClose={onClose}
    >
      <Field>
        <Label>Novo saldo do lote</Label>
        <Input type="number" min={0} value={newQuantity} onChange={(e) => setNewQuantity(Number(e.target.value))} />
        <p className="text-xs text-ink-muted pl-1">
          Diferença registrada: {diff > 0 ? `+${diff}` : diff}
        </p>
      </Field>
      <Field>
        <Label>Motivo (obrigatório)</Label>
        <textarea
          rows={3}
          maxLength={300}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex: contagem de inventário, correção de lançamento"
          className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
        />
      </Field>
      {error && <p className="text-sm text-accent-rose">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          disabled={mut.isPending || invalid}
          onClick={() => {
            setError(null);
            mut.mutate();
          }}
        >
          {mut.isPending ? "Registrando..." : "Registrar ajuste"}
        </Button>
      </div>
    </Modal>
  );
}

// ---------- Movimentações ----------

function MovementsView() {
  const [type, setType] = useState<StockMovementType | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const filters = {
    type: type || undefined,
    from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
    page,
    pageSize: 20,
  };
  const list = useQuery({
    queryKey: ["stock-movements", filters],
    queryFn: () => stockApi.movements(filters),
  });
  const rows = list.data?.data ?? [];

  return (
    <>
      <Card className="grid md:grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
        <Field>
          <Label>Tipo de movimentação</Label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as StockMovementType | "");
              setPage(1);
            }}
            className="h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Todas</option>
            {(Object.keys(MOVEMENT_LABEL) as StockMovementType[]).map((t) => (
              <option key={t} value={t}>{MOVEMENT_LABEL[t]}</option>
            ))}
          </select>
        </Field>
        <Field>
          <Label>De</Label>
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        </Field>
        <Field>
          <Label>Até</Label>
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        </Field>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setType("");
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
              <Th>Unidade</Th>
              <Th>Tipo</Th>
              <Th>Produto</Th>
              <Th>Lote</Th>
              <Th className="text-right">Quantidade</Th>
              <Th className="text-right">Saldo</Th>
              <Th>Detalhes</Th>
              <Th>Responsável</Th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Tr key={i}><Td colSpan={9}><Skeleton className="h-4" /></Td></Tr>
              ))
            ) : list.isError ? (
              <Tr><Td colSpan={9} className="text-center text-accent-rose py-12">Não foi possível carregar as movimentações.</Td></Tr>
            ) : rows.length === 0 ? (
              <Tr><Td colSpan={9} className="text-center text-ink-muted py-12">Nenhuma movimentação encontrada.</Td></Tr>
            ) : (
              rows.map((m) => (
                <Tr key={m.id}>
                  <Td className="whitespace-nowrap text-ink-muted">{dateBR(m.createdAt)}</Td>
                  <Td className="text-ink-muted">{m.unitName}</Td>
                  <Td>
                    <Badge tone={m.quantity >= 0 ? "success" : "orange"}>{MOVEMENT_LABEL[m.type]}</Badge>
                  </Td>
                  <Td>
                    <p className="text-sm font-medium">{m.productName}</p>
                    <p className="text-xs text-ink-muted font-mono">{m.productSku}</p>
                  </Td>
                  <Td className="font-mono text-xs">{m.lotNumber ?? "—"}</Td>
                  <Td className={`text-right font-semibold ${m.quantity >= 0 ? "text-accent-success" : "text-accent-rose"}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </Td>
                  <Td className="text-right font-medium">{m.balance}</Td>
                  <Td className="text-xs text-ink-muted max-w-[220px]">
                    {m.reason && <p className="truncate" title={m.reason}>{m.reason}</p>}
                    {m.document && <p>Doc. {m.document}</p>}
                    {m.supplierName && <p>{m.supplierName}</p>}
                    {!m.reason && !m.document && !m.supplierName && "—"}
                  </Td>
                  <Td className="text-ink-muted">{m.userName}</Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </TableShell>

      <Pagination
        page={list.data?.page ?? page}
        pageSize={list.data?.pageSize ?? 20}
        total={list.data?.total ?? 0}
        onPageChange={setPage}
        noun="movimentação(ões)"
      />
    </>
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
