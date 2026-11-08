import { useMemo, useState } from "react";
import { Topbar } from "@/design-system/layout/Topbar";
import { Card } from "@/design-system/ui/GlassCard";
import { Input } from "@/design-system/ui/Input";
import { Badge } from "@/design-system/ui/Badge";
import { Button } from "@/design-system/ui/Button";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/ui/Table";
import { useToast } from "@/design-system/ui/Toast";
import { errorMessage } from "@/lib/api-client";
import { EmptyState } from "@/design-system/ui/EmptyState";
import { ErrorState } from "@/design-system/ui/ErrorState";
import { Skeleton } from "@/design-system/ui/Skeleton";
import { useAuditFacets, useAuditLogs, useRunExpirationAlerts } from "@/features/audit/hooks";
import { dateBR } from "@/lib/utils";
import { Bell, FileSearch, Filter } from "lucide-react";
import { ACTION_LABEL, ACTION_TONE } from "@/features/audit/constants";
import { StatMini } from "../components/StatMini";

export default function AuditPage() {
  const [entity, setEntity] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const facets = useAuditFacets();

  const filters = {
    entity: entity || undefined,
    action: action || undefined,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
    page,
    pageSize: 25,
  };
  const list = useAuditLogs(filters);

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

  const toast = useToast();
  const alertsMut = useRunExpirationAlerts();

  return (
    <div className="space-y-6">
      <Topbar
        title="Auditoria"
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              alertsMut.mutate(undefined, {
                onSuccess: (data) =>
                  toast.success(
                    "Alertas processados",
                    `Vencendo em 30d: ${data.summary.expiringSoon}
Baixo estoque: ${data.summary.lowStock}
Notificados: ${data.summary.notifiedRecipients.length}`,
                  ),
                onError: (err) => toast.error("Falha ao disparar alertas", errorMessage(err, "")),
              })
            }
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
            {list.isError ? (
              <Tr>
                <Td colSpan={7}>
                  <ErrorState error={list.error} onRetry={() => list.refetch()} />
                </Td>
              </Tr>
            ) : list.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Tr key={i}>
                  <Td colSpan={7}><Skeleton className="h-4" /></Td>
                </Tr>
              ))
            ) : (list.data?.data.length ?? 0) === 0 ? (
              <Tr>
                <Td colSpan={7}>
                  <EmptyState title="Nenhum registro no filtro atual." />
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

