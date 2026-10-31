import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Ban, Eye, Pill, Receipt } from "lucide-react";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Field, Input, Label } from "@/design-system/components/Input";
import { Badge } from "@/design-system/components/Badge";
import { Modal } from "@/design-system/components/Modal";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/components/Table";
import { Skeleton } from "@/design-system/components/Skeleton";
import { Pagination } from "@/design-system/components/Pagination";
import { useToast } from "@/design-system/components/Toast";
import { PatientPicker } from "@/features/patients/PatientPicker";
import type { PatientDTO } from "@/features/patients/api";
import { dispensationsApi, type DispensationStatus } from "@/features/dispensations/api";
import { isControlled } from "@/features/products/api";
import { dateBR, dayBR, errMsg } from "@/lib/utils";

const TABS: { key: DispensationStatus | "todos"; label: string }[] = [
  { key: "todos", label: "Todas" },
  { key: "COMPLETED", label: "Concluídas" },
  { key: "CANCELED", label: "Canceladas" },
];

const STATUS_LABEL: Record<DispensationStatus, string> = {
  COMPLETED: "Concluída",
  CANCELED: "Cancelada",
};

export default function DispensationsPage() {
  const [tab, setTab] = useState<"todos" | DispensationStatus>("todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [patient, setPatient] = useState<PatientDTO | null>(null);
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);

  const filters = {
    status: tab !== "todos" ? tab : undefined,
    from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
    patientId: patient?.id,
    page,
    pageSize: 15,
  };

  const list = useQuery({
    queryKey: ["dispensations", filters],
    queryFn: () => dispensationsApi.list(filters),
  });
  const rows = list.data?.data ?? [];

  return (
    <div className="space-y-6">
      <Topbar
        title="Dispensações"
        tabs={TABS.map((t) => ({ key: t.key, label: t.label }))}
        activeTab={tab}
        onTabChange={(k) => {
          setTab(k as typeof tab);
          setPage(1);
        }}
        actions={
          <Button size="sm" asChild>
            <Link to="/dispensacao">
              <Pill className="size-4" /> Nova dispensação
            </Link>
          </Button>
        }
      />

      <Card className="grid md:grid-cols-[auto_1fr_auto] gap-4 items-end">
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <Field>
            <Label>De</Label>
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          </Field>
          <Field>
            <Label>Até</Label>
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          </Field>
        </div>
        <Field>
          <Label>Paciente</Label>
          <PatientPicker value={patient} onChange={(p) => { setPatient(p); setPage(1); }} allowCreate={false} />
        </Field>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFrom("");
            setTo("");
            setPatient(null);
            setPage(1);
          }}
        >
          Limpar filtros
        </Button>
      </Card>

      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Data</Th>
              <Th>Unidade</Th>
              <Th>Dispensador</Th>
              <Th>Paciente</Th>
              <Th className="text-right">Itens</Th>
              <Th>Situação</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Tr key={i}><Td colSpan={7}><Skeleton className="h-4" /></Td></Tr>
              ))
            ) : list.isError ? (
              <Tr><Td colSpan={7} className="text-center text-accent-rose py-12">Não foi possível carregar as dispensações.</Td></Tr>
            ) : rows.length === 0 ? (
              <Tr><Td colSpan={7} className="text-center text-ink-muted py-12">Nenhuma dispensação encontrada.</Td></Tr>
            ) : (
              rows.map((d) => (
                <Tr key={d.id}>
                  <Td className="text-ink-muted whitespace-nowrap">{dateBR(d.createdAt)}</Td>
                  <Td className="text-ink-muted">{d.unitName}</Td>
                  <Td className="font-medium">{d.userName}</Td>
                  <Td>{d.patientName ?? <span className="text-ink-subtle">Não identificado</span>}</Td>
                  <Td className="text-right">{d.itemCount}</Td>
                  <Td>
                    <Badge tone={d.status === "COMPLETED" ? "success" : "danger"} dot>
                      {STATUS_LABEL[d.status]}
                    </Badge>
                  </Td>
                  <Td className="text-right whitespace-nowrap">
                    <button
                      onClick={() => setDetailId(d.id)}
                      className="inline-flex items-center gap-1 text-brand-500 hover:underline text-xs font-medium mr-3"
                    >
                      <Eye className="size-3.5" /> Detalhes
                    </button>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </TableShell>

      <Pagination
        page={list.data?.page ?? page}
        pageSize={list.data?.pageSize ?? 15}
        total={list.data?.total ?? 0}
        onPageChange={setPage}
        noun="dispensação(ões)"
      />

      {detailId && <DetailModal id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

function DetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [canceling, setCanceling] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const detail = useQuery({
    queryKey: ["dispensation", id],
    queryFn: () => dispensationsApi.get(id),
  });
  const d = detail.data?.dispensation;

  const cancelMut = useMutation({
    mutationFn: () => dispensationsApi.cancel(id, reason.trim()),
    onSuccess: () => {
      for (const key of ["dispensations", "dispensation", "dashboard-metrics", "products", "batches", "stock-movements"]) {
        qc.invalidateQueries({ queryKey: [key] });
      }
      toast.success("Dispensação cancelada", "O estoque foi devolvido aos lotes originais.");
      setCanceling(false);
      setReason("");
    },
    onError: (err) => setError(errMsg(err)),
  });

  if (canceling) {
    return (
      <Modal
        title="Cancelar dispensação"
        description="O estoque será devolvido aos lotes de origem. Informe o motivo do cancelamento."
        onClose={() => setCanceling(false)}
      >
        <Field>
          <Label>Motivo (obrigatório)</Label>
          <textarea
            autoFocus
            rows={3}
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
          />
          {reason.length > 0 && reason.trim().length < 3 && (
            <p className="text-xs text-accent-rose pl-1">Descreva o motivo com ao menos 3 caracteres.</p>
          )}
        </Field>
        {error && <p className="text-sm text-accent-rose">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setCanceling(false)}>Voltar</Button>
          <Button
            variant="danger"
            disabled={cancelMut.isPending || reason.trim().length < 3}
            onClick={() => {
              setError(null);
              cancelMut.mutate();
            }}
          >
            <Ban className="size-4" />
            {cancelMut.isPending ? "Cancelando..." : "Cancelar dispensação"}
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Detalhes da dispensação"
      description={d ? `#${d.id.slice(-8).toUpperCase()}` : undefined}
      onClose={onClose}
      className="max-w-2xl"
    >
      {detail.isLoading ? (
        <Skeleton className="h-40" />
      ) : detail.isError || !d ? (
        <p className="text-sm text-accent-rose">Não foi possível carregar a dispensação.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <Info label="Data" value={dateBR(d.createdAt)} />
            <Info label="Unidade" value={d.unitName} />
            <Info label="Dispensador" value={d.userName} />
            <Info label="Paciente" value={d.patientName ?? "Não identificado"} />
            <Info label="Farmacêutico" value={d.pharmacistName ?? "—"} />
            <Info
              label="Situação"
              value={
                <Badge tone={d.status === "COMPLETED" ? "success" : "danger"} dot>
                  {STATUS_LABEL[d.status]}
                </Badge>
              }
            />
          </div>

          {d.prescription && (
            <div className="rounded-lg border border-line p-3 text-sm">
              <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">Receita</p>
              <p className="mt-0.5">
                {d.prescription.number ? `Nº ${d.prescription.number} · ` : ""}
                {d.prescription.prescriberName} ({d.prescription.prescriberCouncil} {d.prescription.prescriberCouncilNumber})
              </p>
              <p className="text-xs text-ink-muted">
                Emitida {dayBR(d.prescription.issuedAt)} · válida até {dayBR(d.prescription.validUntil)}
              </p>
            </div>
          )}

          {d.status === "CANCELED" && (
            <div className="rounded-lg border border-accent-rose/20 bg-accent-rose/5 p-3 text-sm">
              <p className="font-medium text-accent-rose">
                Cancelada{d.canceledAt ? ` em ${dateBR(d.canceledAt)}` : ""}
              </p>
              <p className="text-ink">{d.cancelReason}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-ink-muted mb-2">Itens</p>
            <div className="border border-line rounded-lg divide-y divide-line">
              {d.items.map((i) => (
                <div key={i.id} className="flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {i.productName}{" "}
                      {isControlled(i.controlledClass) && <Badge tone="danger">{i.controlledClass}</Badge>}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {i.presentation ?? i.productSku}
                      {i.lotNumber && <> · Lote <span className="font-mono">{i.lotNumber}</span></>}
                      {i.expiresAt && <> · val. {dayBR(i.expiresAt)}</>}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {i.quantity} {i.measureUnit ?? "un."}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => dispensationsApi.openReceipt(d.id).catch((e) => toast.error("Comprovante", errMsg(e)))}
            >
              <Receipt className="size-4" /> Abrir comprovante
            </Button>
            {d.status === "COMPLETED" && (
              <Button variant="danger" onClick={() => setCanceling(true)}>
                <Ban className="size-4" /> Cancelar dispensação
              </Button>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">{label}</p>
      <div className="text-sm text-ink mt-0.5">{value}</div>
    </div>
  );
}
