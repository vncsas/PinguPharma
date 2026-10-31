import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/design-system/components/Toast";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Input } from "@/design-system/components/Input";
import { Badge } from "@/design-system/components/Badge";
import { Button } from "@/design-system/components/Button";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/components/Table";
import { Skeleton } from "@/design-system/components/Skeleton";
import { auditApi } from "@/features/audit/api";
import { alertsApi } from "@/features/alerts/api";
import { dateBR } from "@/lib/utils";
import { Bell, FileSearch, Filter } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const ACTION_TONE: Record<string, "success" | "warn" | "danger" | "brand"> = {
  PRODUCT_CREATED: "success",
  PRODUCT_UPDATED: "warn",
  PRODUCT_DELETED: "danger",
  DISPENSATION_CREATED: "success",
  DISPENSATION_CANCELED: "danger",
  PATIENT_CREATED: "success",
  PATIENT_UPDATED: "warn",
  PATIENT_DELETED: "danger",
  PATIENT_VIEWED: "brand",
  PRESCRIPTION_CREATED: "success",
  STOCK_LOSS: "danger",
  STOCK_ADJUSTMENT: "warn",
  UNIT_CREATED: "success",
  UNIT_UPDATED: "warn",
  SUPPLIER_CREATED: "success",
  SUPPLIER_UPDATED: "warn",
  USER_CREATED: "success",
  USER_UPDATED: "warn",
  USER_DELETED: "danger",
  PASSWORD_RESET: "warn",
};

const ACTION_LABEL: Record<string, string> = {
  PRODUCT_CREATED: "Produto criado",
  PRODUCT_UPDATED: "Produto atualizado",
  PRODUCT_DELETED: "Produto excluído",
  DISPENSATION_CREATED: "Dispensação registrada",
  DISPENSATION_CANCELED: "Dispensação cancelada",
  PATIENT_CREATED: "Paciente cadastrado",
  PATIENT_UPDATED: "Paciente atualizado",
  PATIENT_DELETED: "Paciente excluído",
  PATIENT_VIEWED: "Dados de paciente consultados",
  PRESCRIPTION_CREATED: "Receita cadastrada",
  STOCK_LOSS: "Perda de estoque",
  STOCK_ADJUSTMENT: "Ajuste de estoque",
  UNIT_CREATED: "Unidade criada",
  UNIT_UPDATED: "Unidade atualizada",
  SUPPLIER_CREATED: "Fornecedor cadastrado",
  SUPPLIER_UPDATED: "Fornecedor atualizado",
  USER_CREATED: "Usuário criado",
  USER_UPDATED: "Usuário atualizado",
  USER_DELETED: "Usuário excluído",
  PASSWORD_RESET: "Senha redefinida",
};

export default function AuditPage() {
  const [entity, setEntity] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const facets = useQuery({ queryKey: ["audit-facets"], queryFn: auditApi.facets });

  const filters = {
    entity: entity || undefined,
    action: action || undefined,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
    page,
    pageSize: 25,
  };
  const list = useQuery({ queryKey: ["audit", filters], queryFn: () => auditApi.list(filters) });

  const pageCount = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.pageSize)) : 1;

  const kpis = useMemo(() => {
    const rows = list.data?.data ?? [];
    const byAction = new Map<string, number>();
    rows.forEach((r) => byAction.set(r.action, (byAction.get(r.action) ?? 0) + 1));
    return {
      total: list.data?.total ?? 0,
      users: new Set(rows.map((r) => r.userId).filter(Boolean)).size,
      distinctActions: byAction.size,
    };
  }, [list.data]);

  const qc = useQueryClient();
  const toast = useToast();
  const alertsMut = useMutation({
    mutationFn: alertsApi.runExpiration,
    onError: (e: Error) => toast.error("Falha ao disparar alertas", e.message),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["audit"] });
      toast.success(
        "Alertas processados",
        `Vencendo em 30d: ${data.summary.expiringSoon} | Vencidos: ${data.summary.expired} | Baixo estoque: ${data.summary.lowStock} | Estoque crítico: ${data.summary.stockCritical ?? 0} | Unidades: ${data.summary.byUnit?.length ?? 0} | Notificados: ${data.summary.notifiedRecipients.length} | E-mails: ${data.summary.emailsSent}`,
      );
    },
  });

  return (
    <div className="space-y-6">
      <Topbar
        title="Auditoria"
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => alertsMut.mutate()}
            disabled={alertsMut.isPending}
          >
            <Bell className="size-4" />
            {alertsMut.isPending ? "Rodando..." : "Disparar alertas de validade"}
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <StatMini label="Registros no filtro" value={kpis.total} icon={<FileSearch className="size-4" />} />
        <StatMini label="Usuários envolvidos" value={kpis.users} icon={<Filter className="size-4" />} />
        <StatMini label="Ações distintas (página)" value={kpis.distinctActions} icon={<Filter className="size-4" />} />
      </div>

      <Card className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-ink-muted">Entidade</label>
          <select
            value={entity}
            onChange={(e) => { setEntity(e.target.value); setPage(1); }}
            className="w-full h-10 rounded-lg border border-line-strong bg-white text-sm px-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
          >
            <option value="">Todas</option>
            {facets.data?.entities.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted">Ação</label>
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="w-full h-10 rounded-lg border border-line-strong bg-white text-sm px-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
          >
            <option value="">Todas</option>
            {facets.data?.actions.map((a) => (
              <option key={a} value={a}>{ACTION_LABEL[a] ?? a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted">De</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted">Até</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button
          variant="outline"
          onClick={() => { setEntity(""); setAction(""); setFrom(""); setTo(""); setPage(1); }}
        >
          Limpar
        </Button>
      </Card>

      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Quando</Th>
              <Th>Usuário</Th>
              <Th>Ação</Th>
              <Th>Entidade</Th>
              <Th>ID</Th>
              <Th>IP</Th>
              <Th>Detalhes</Th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Tr key={i}>
                  <Td colSpan={7}><Skeleton className="h-4" /></Td>
                </Tr>
              ))
            ) : (list.data?.data.length ?? 0) === 0 ? (
              <Tr>
                <Td colSpan={7} className="text-center text-ink-muted py-12">
                  Nenhum registro no filtro atual.
                </Td>
              </Tr>
            ) : (
              list.data!.data.map((r) => (
                <Tr key={r.id}>
                  <Td className="text-ink-muted whitespace-nowrap">{dateBR(r.createdAt)}</Td>
                  <Td className="font-medium">{r.userName ?? "—"}</Td>
                  <Td>
                    <Badge tone={ACTION_TONE[r.action] ?? "neutral"} dot>
                      {ACTION_LABEL[r.action] ?? r.action}
                    </Badge>
                  </Td>
                  <Td>{r.entity}</Td>
                  <Td className="font-mono text-xs text-ink-muted">
                    {r.entityId ? r.entityId.slice(-8) : "—"}
                  </Td>
                  <Td className="text-xs text-ink-muted">{r.ipAddress ?? "—"}</Td>
                  <Td className="text-xs text-ink-muted max-w-xs truncate">
                    {r.metadata ? JSON.stringify(r.metadata) : "—"}
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </TableShell>

      <div className="flex items-center justify-between text-sm text-ink-muted">
        <span>Página {list.data?.page ?? 1} de {pageCount} · {list.data?.total ?? 0} registros</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatMini({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-600">{icon}</div>
      <div>
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </Card>
  );
}
