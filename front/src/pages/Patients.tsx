import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Search, Trash2, UserPlus } from "lucide-react";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Input } from "@/design-system/components/Input";
import { Badge } from "@/design-system/components/Badge";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/components/Table";
import { Skeleton } from "@/design-system/components/Skeleton";
import { Pagination } from "@/design-system/components/Pagination";
import { useToast } from "@/design-system/components/Toast";
import { useConfirm } from "@/design-system/components/ConfirmDialog";
import { patientsApi } from "@/features/patients/api";
import { PatientFormModal } from "@/features/patients/PatientFormModal";
import { useAuth } from "@/lib/auth-context";
import { STAFF_ROLES } from "@/lib/roles";
import { ApiError } from "@/lib/api-client";
import { dayBR, errMsg } from "@/lib/utils";

export default function PatientsPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const canDelete = !!user && STAFF_ROLES.includes(user.role);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filters = { search: search || undefined, page, pageSize: 15 };
  const list = useQuery({
    queryKey: ["patients", filters],
    queryFn: () => patientsApi.list(filters),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => patientsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente excluído");
    },
    onError: (err) =>
      err instanceof ApiError && err.status === 409
        ? toast.error("Paciente com histórico", "Há dispensações ou receitas vinculadas. Inative o paciente em vez de excluir.")
        : toast.error("Não foi possível excluir", errMsg(err)),
  });

  const rows = list.data?.data ?? [];

  return (
    <div className="space-y-6">
      <Topbar
        title="Pacientes"
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <UserPlus className="size-4" /> Novo paciente
          </Button>
        }
      />

      <Card>
        <Input
          leadingIcon={<Search className="size-4" />}
          placeholder="Buscar por nome, CPF ou CNS"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </Card>

      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Paciente</Th>
              <Th>CPF</Th>
              <Th>CNS</Th>
              <Th>Nascimento</Th>
              <Th>Contato</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Tr key={i}><Td colSpan={6}><Skeleton className="h-4" /></Td></Tr>
              ))
            ) : list.isError ? (
              <Tr><Td colSpan={6} className="text-center text-accent-rose py-12">Não foi possível carregar os pacientes.</Td></Tr>
            ) : rows.length === 0 ? (
              <Tr><Td colSpan={6} className="text-center text-ink-muted py-12">Nenhum paciente encontrado.</Td></Tr>
            ) : (
              rows.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-ink text-white grid place-items-center text-xs font-semibold">
                        {p.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        {!p.active && <Badge tone="neutral">Inativo</Badge>}
                      </div>
                    </div>
                  </Td>
                  <Td className="font-mono text-xs text-ink-muted">{p.cpf ?? "—"}</Td>
                  <Td className="font-mono text-xs text-ink-muted">{p.cns ?? "—"}</Td>
                  <Td className="text-sm text-ink-muted">{p.birthDate ? dayBR(p.birthDate) : "—"}</Td>
                  <Td className="text-sm text-ink-muted">
                    <div className="flex flex-col">
                      {p.phone && <span className="inline-flex items-center gap-1"><Phone className="size-3" /> {p.phone}</span>}
                      {p.email && <span className="inline-flex items-center gap-1"><Mail className="size-3" /> {p.email}</span>}
                      {!p.phone && !p.email && <span>—</span>}
                    </div>
                  </Td>
                  <Td className="text-right whitespace-nowrap">
                    <button
                      onClick={() => setEditingId(p.id)}
                      className="text-xs font-medium text-brand-500 hover:underline mr-3"
                    >
                      Editar
                    </button>
                    {canDelete && (
                      <button
                        aria-label={`Excluir ${p.name}`}
                        onClick={async () => {
                          if (
                            await confirm({
                              title: `Excluir ${p.name}?`,
                              description: "Pacientes com dispensações ou receitas podem não ser excluídos.",
                              confirmLabel: "Excluir",
                              tone: "danger",
                            })
                          )
                            removeMut.mutate(p.id);
                        }}
                        className="text-xs font-medium text-accent-rose hover:underline"
                      >
                        <Trash2 className="inline size-3.5" />
                      </button>
                    )}
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
        noun="paciente(s)"
      />

      <p className="text-xs text-ink-muted">
        CPF e CNS aparecem mascarados nas listagens. O acesso aos dados completos fica registrado na auditoria.
      </p>

      {showCreate && <PatientFormModal onClose={() => setShowCreate(false)} />}
      {editingId && <PatientFormModal patientId={editingId} onClose={() => setEditingId(null)} />}
    </div>
  );
}
