import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Plus, Trash2 } from "lucide-react";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Badge } from "@/design-system/components/Badge";
import { Field, Input, Label } from "@/design-system/components/Input";
import { Modal } from "@/design-system/components/Modal";
import { Pagination } from "@/design-system/components/Pagination";
import { Skeleton } from "@/design-system/components/Skeleton";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/components/Table";
import { UnitRequiredNotice } from "@/design-system/components/UnitRequiredNotice";
import { useConfirm } from "@/design-system/components/ConfirmDialog";
import { useToast } from "@/design-system/components/Toast";
import { useAuth } from "@/lib/auth-context";
import { useUnit } from "@/lib/unit-context";
import { STAFF_ROLES } from "@/lib/roles";
import { dateBR, dayBR, errMsg } from "@/lib/utils";
import { productsApi } from "@/features/products/api";
import { useUnits } from "@/features/units/api";
import {
  TRANSFER_STATUS_LABEL,
  transfersApi,
  useRequestTransfer,
  useTransferAction,
  type TransferAction,
  type TransferDTO,
  type TransferStatus,
} from "@/features/transfers/api";

const PAGE_SIZE = 15;

const STATUS_TONE: Record<TransferStatus, "warn" | "brand" | "success" | "danger" | "neutral"> = {
  REQUESTED: "warn",
  SENT: "brand",
  RECEIVED: "success",
  REJECTED: "danger",
  CANCELED: "neutral",
};

const TABS = [
  { key: "in", label: "Recebidas" },
  { key: "out", label: "Enviadas" },
];

export default function TransfersPage() {
  const { user } = useAuth();
  const { isAdmin, needsUnit } = useUnit();
  const canAct = !!user && STAFF_ROLES.includes(user.role);
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [status, setStatus] = useState<TransferStatus | "">("");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filters = { direction, status: status || undefined, page, pageSize: PAGE_SIZE };
  const list = useQuery({ queryKey: ["transfers", filters], queryFn: () => transfersApi.list(filters) });
  const rows = list.data?.data ?? [];

  return (
    <div className="space-y-6">
      <Topbar
        title="Transferências"
        tabs={TABS}
        activeTab={direction}
        onTabChange={(k) => {
          setDirection(k as "in" | "out");
          setPage(1);
        }}
        actions={
          canAct && (
            <Button size="sm" onClick={() => setShowNew(true)} disabled={needsUnit}>
              <Plus className="size-4" /> Nova solicitação
            </Button>
          )
        }
      />

      {isAdmin && <UnitRequiredNotice action="solicitar transferências" />}

      <Card className="flex flex-wrap items-end gap-3">
        <Field>
          <Label>Situação</Label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as TransferStatus | "");
              setPage(1);
            }}
            className="h-10 rounded-lg border border-line-strong bg-white px-3 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Todas</option>
            {(Object.keys(TRANSFER_STATUS_LABEL) as TransferStatus[]).map((s) => (
              <option key={s} value={s}>{TRANSFER_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </Field>
      </Card>

      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Data</Th>
              <Th>Origem</Th>
              <Th>Destino</Th>
              <Th>Itens</Th>
              <Th>Situação</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Tr key={i}><Td colSpan={6}><Skeleton className="h-4" /></Td></Tr>
              ))
            ) : list.isError ? (
              <Tr><Td colSpan={6} className="text-center text-accent-rose py-12">Não foi possível carregar as transferências.</Td></Tr>
            ) : rows.length === 0 ? (
              <Tr>
                <Td colSpan={6} className="text-center text-ink-muted py-12">
                  <ArrowLeftRight className="size-5 mx-auto mb-2" />
                  Nenhuma transferência {direction === "in" ? "recebida" : "enviada"}.
                </Td>
              </Tr>
            ) : (
              rows.map((t) => (
                <Tr key={t.id}>
                  <Td className="text-ink-muted whitespace-nowrap">{dateBR(t.createdAt)}</Td>
                  <Td>{t.fromUnitName}</Td>
                  <Td>{t.toUnitName}</Td>
                  <Td>{t.items.length}</Td>
                  <Td><Badge tone={STATUS_TONE[t.status]} dot>{TRANSFER_STATUS_LABEL[t.status]}</Badge></Td>
                  <Td className="text-right">
                    <button onClick={() => setDetailId(t.id)} className="text-xs font-medium text-brand-500 hover:underline">
                      Detalhes
                    </button>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </TableShell>

      {list.data && list.data.total > PAGE_SIZE && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={list.data.total} onPageChange={setPage} noun="transferência(s)" />
      )}

      {detailId && <DetailModal id={detailId} canAct={canAct} onClose={() => setDetailId(null)} />}
      {showNew && <NewTransferModal onClose={() => setShowNew(false)} />}
    </div>
  );
}

// ---------- detalhe e ações ----------

function availableActions(t: TransferDTO, role: string | undefined, userUnitId: string | null | undefined): TransferAction[] {
  const admin = role === "ADMIN";
  const isFrom = admin || userUnitId === t.fromUnitId;
  const isTo = admin || userUnitId === t.toUnitId;
  const out: TransferAction[] = [];
  if (t.status === "REQUESTED") {
    if (isFrom) out.push("send", "reject");
    if (isTo) out.push("cancel");
  } else if (t.status === "SENT") {
    if (isTo) out.push("receive", "reject");
    if (isFrom) out.push("cancel");
  }
  return out;
}

const ACTION_META: Record<TransferAction, { label: string; done: string; variant: "primary" | "outline" | "danger"; reason: boolean }> = {
  send: { label: "Enviar", done: "Transferência enviada", variant: "primary", reason: false },
  receive: { label: "Confirmar recebimento", done: "Recebimento confirmado", variant: "primary", reason: false },
  reject: { label: "Recusar", done: "Transferência recusada", variant: "danger", reason: true },
  cancel: { label: "Cancelar", done: "Transferência cancelada", variant: "outline", reason: true },
};

function DetailModal({ id, canAct, onClose }: { id: string; canAct: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const action = useTransferAction();
  const [reasonFor, setReasonFor] = useState<TransferAction | null>(null);
  const q = useQuery({ queryKey: ["transfers", "detail", id], queryFn: () => transfersApi.get(id) });
  const t = q.data?.transfer;
  const actions = t && canAct ? availableActions(t, user?.role, user?.unitId) : [];

  async function run(a: TransferAction, reason?: string) {
    try {
      await action.mutateAsync({ id, action: a, reason });
      toast.success(ACTION_META[a].done);
      setReasonFor(null);
    } catch (err) {
      toast.error("Não foi possível concluir", errMsg(err));
    }
  }

  async function start(a: TransferAction) {
    if (ACTION_META[a].reason) return setReasonFor(a);
    const ok = await confirm({
      title: a === "send" ? "Enviar transferência?" : "Confirmar recebimento?",
      description:
        a === "send"
          ? "O estoque será baixado por lote (FEFO) na unidade de origem."
          : "Os lotes enviados serão incluídos no estoque da unidade de destino.",
      confirmLabel: ACTION_META[a].label,
    });
    if (ok) run(a);
  }

  return (
    <>
      <Modal title="Detalhes da transferência" onClose={onClose} className="max-w-2xl">
        {q.isLoading || !t ? (
          q.isError ? (
            <p className="text-sm text-accent-rose">Não foi possível carregar a transferência.</p>
          ) : (
            <div className="space-y-2"><Skeleton className="h-4" /><Skeleton className="h-4" /><Skeleton className="h-4" /></div>
          )
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Badge tone={STATUS_TONE[t.status]} dot>{TRANSFER_STATUS_LABEL[t.status]}</Badge>
              <span className="text-xs text-ink-muted">{dateBR(t.createdAt)}</span>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Origem" value={t.fromUnitName} />
              <Info label="Destino" value={t.toUnitName} />
              <Info label="Solicitada por" value={t.requestedByName} />
              <Info label="Enviada por" value={t.sentByName ? `${t.sentByName}${t.sentAt ? ` · ${dateBR(t.sentAt)}` : ""}` : "—"} />
              <Info label="Recebida por" value={t.receivedByName ? `${t.receivedByName}${t.receivedAt ? ` · ${dateBR(t.receivedAt)}` : ""}` : "—"} />
              {t.notes && <Info label="Observações" value={t.notes} />}
            </dl>
            <TableShell>
              <Table>
                <thead>
                  <tr>
                    <Th>Produto</Th>
                    <Th>Lote</Th>
                    <Th>Validade</Th>
                    <Th className="text-right">Qtd.</Th>
                  </tr>
                </thead>
                <tbody>
                  {t.items.map((i) => (
                    <Tr key={i.id}>
                      <Td>
                        <p className="font-medium">{i.productName}</p>
                        <p className="text-xs text-ink-muted font-mono">{i.productSku}</p>
                      </Td>
                      <Td className="text-ink-muted">{i.lotNumber ?? "—"}</Td>
                      <Td className="text-ink-muted">{i.expiresAt ? dayBR(i.expiresAt) : "—"}</Td>
                      <Td className="text-right font-semibold">{i.quantity}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableShell>
            {actions.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2">
                {actions.map((a) => (
                  <Button key={a} variant={ACTION_META[a].variant} size="sm" disabled={action.isPending} onClick={() => start(a)}>
                    {ACTION_META[a].label}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </Modal>
      {reasonFor && (
        <ReasonModal
          title={reasonFor === "reject" ? "Recusar transferência" : "Cancelar transferência"}
          pending={action.isPending}
          onClose={() => setReasonFor(null)}
          onSubmit={(reason) => run(reasonFor, reason)}
        />
      )}
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

function ReasonModal({
  title,
  pending,
  onClose,
  onSubmit,
}: {
  title: string;
  pending: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();
  const invalid = trimmed.length < 3 || trimmed.length > 500;
  return (
    <Modal title={title} description="Informe o motivo (3 a 500 caracteres)." onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!invalid) onSubmit(trimmed);
        }}
      >
        <Field>
          <Label>Motivo</Label>
          <textarea
            autoFocus
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Voltar</Button>
          <Button type="submit" variant="danger" disabled={invalid || pending}>Confirmar</Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- nova solicitação ----------

function NewTransferModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const { currentUnit } = useUnit();
  const request = useRequestTransfer();
  const units = useUnits({ activeOnly: true });
  const [fromUnitId, setFromUnitId] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<{ productId: string; name: string; sku: string; quantity: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const products = useQuery({
    queryKey: ["products", "transfer-search", search],
    queryFn: () => productsApi.list({ search, active: true, pageSize: 6 }),
    enabled: search.trim().length >= 2,
  });

  const origins = (units.data?.units ?? []).filter((u) => u.id !== currentUnit?.id);

  function addProduct(p: { id: string; name: string; sku: string }) {
    setItems((cur) => (cur.some((i) => i.productId === p.id) ? cur : [...cur, { productId: p.id, name: p.name, sku: p.sku, quantity: 1 }]));
    setSearch("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fromUnitId) return setError("Selecione a unidade de origem.");
    if (items.length === 0) return setError("Adicione ao menos um item.");
    if (items.some((i) => !Number.isInteger(i.quantity) || i.quantity < 1)) return setError("Quantidades devem ser inteiros positivos.");
    try {
      await request.mutateAsync({
        fromUnitId,
        notes: notes.trim() || null,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      toast.success("Transferência solicitada");
      onClose();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  return (
    <Modal title="Nova solicitação de transferência" description={currentUnit ? `Destino: ${currentUnit.name}` : undefined} onClose={onClose} className="max-w-xl">
      <form onSubmit={submit} className="space-y-4">
        <Field>
          <Label>Unidade de origem</Label>
          <select
            value={fromUnitId}
            onChange={(e) => setFromUnitId(e.target.value)}
            className="h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Selecione...</option>
            {origins.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </Field>

        <Field>
          <Label>Adicionar produto</Label>
          <Input placeholder="Buscar por nome ou código (mín. 2 letras)" value={search} onChange={(e) => setSearch(e.target.value)} />
          {search.trim().length >= 2 && (
            <div className="rounded-lg border border-line divide-y divide-line">
              {products.isLoading ? (
                <div className="p-3"><Skeleton className="h-4" /></div>
              ) : (products.data?.data ?? []).length === 0 ? (
                <p className="p-3 text-sm text-ink-muted">Nenhum produto encontrado.</p>
              ) : (
                products.data!.data.map((p) => (
                  <button key={p.id} type="button" onClick={() => addProduct(p)} className="w-full text-left px-3 py-2 text-sm hover:bg-surface-alt">
                    {p.name} <span className="text-xs text-ink-muted font-mono">{p.sku}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </Field>

        {items.length > 0 && (
          <ul className="space-y-2">
            {items.map((i) => (
              <li key={i.productId} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{i.name}</p>
                  <p className="text-xs text-ink-muted font-mono">{i.sku}</p>
                </div>
                <Input
                  type="number"
                  min={1}
                  className="w-24"
                  aria-label={`Quantidade de ${i.name}`}
                  value={i.quantity}
                  onChange={(e) =>
                    setItems((cur) => cur.map((x) => (x.productId === i.productId ? { ...x, quantity: Number(e.target.value) } : x)))
                  }
                />
                <button type="button" aria-label={`Remover ${i.name}`} onClick={() => setItems((cur) => cur.filter((x) => x.productId !== i.productId))} className="text-accent-rose">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <Field>
          <Label>Observações (opcional)</Label>
          <Input value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        {error && <p className="text-sm text-accent-rose bg-accent-rose/5 border border-accent-rose/20 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={request.isPending}>Solicitar</Button>
        </div>
      </form>
    </Modal>
  );
}
