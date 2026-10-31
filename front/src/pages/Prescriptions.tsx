import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FilePlus2 } from "lucide-react";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Badge } from "@/design-system/components/Badge";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/components/Table";
import { Skeleton } from "@/design-system/components/Skeleton";
import { Pagination } from "@/design-system/components/Pagination";
import { Label } from "@/design-system/components/Input";
import { PatientPicker } from "@/features/patients/PatientPicker";
import { PrescriptionFormModal } from "@/features/prescriptions/PrescriptionFormModal";
import type { PatientDTO } from "@/features/patients/api";
import { isPrescriptionValid, prescriptionsApi } from "@/features/prescriptions/api";
import { useAuth } from "@/lib/auth-context";
import { STAFF_ROLES } from "@/lib/roles";
import { dayBR } from "@/lib/utils";

export default function PrescriptionsPage() {
  const { user } = useAuth();
  const canCreate = !!user && STAFF_ROLES.includes(user.role);
  const [patient, setPatient] = useState<PatientDTO | null>(null);
  const [validOnly, setValidOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const filters = {
    patientId: patient?.id,
    validOnly: validOnly || undefined,
    page,
    pageSize: 15,
  };
  const list = useQuery({
    queryKey: ["prescriptions", filters],
    queryFn: () => prescriptionsApi.list(filters),
  });
  const rows = list.data?.data ?? [];

  return (
    <div className="space-y-6">
      <Topbar
        title="Receitas"
        actions={
          canCreate ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <FilePlus2 className="size-4" /> Cadastrar receita
            </Button>
          ) : undefined
        }
      />

      <Card className="grid md:grid-cols-[1fr_auto] gap-4 items-end">
        <div className="space-y-1.5">
          <Label>Filtrar por paciente</Label>
          <PatientPicker
            value={patient}
            onChange={(p) => {
              setPatient(p);
              setPage(1);
            }}
            allowCreate={false}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink h-10">
          <input
            type="checkbox"
            checked={validOnly}
            onChange={(e) => {
              setValidOnly(e.target.checked);
              setPage(1);
            }}
            className="size-4 accent-brand-500"
          />
          Somente receitas válidas
        </label>
      </Card>

      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Paciente</Th>
              <Th>Prescritor</Th>
              <Th>Nº</Th>
              <Th>Emissão</Th>
              <Th>Validade</Th>
              <Th>Situação</Th>
              <Th>Unidade</Th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Tr key={i}><Td colSpan={7}><Skeleton className="h-4" /></Td></Tr>
              ))
            ) : list.isError ? (
              <Tr><Td colSpan={7} className="text-center text-accent-rose py-12">Não foi possível carregar as receitas.</Td></Tr>
            ) : rows.length === 0 ? (
              <Tr><Td colSpan={7} className="text-center text-ink-muted py-12">Nenhuma receita encontrada.</Td></Tr>
            ) : (
              rows.map((r) => {
                const valid = isPrescriptionValid(r);
                return (
                  <Tr key={r.id}>
                    <Td className="font-medium">{r.patientName}</Td>
                    <Td>
                      <p className="text-sm">{r.prescriberName}</p>
                      <p className="text-xs text-ink-muted">{r.prescriberCouncil} {r.prescriberCouncilNumber}</p>
                    </Td>
                    <Td className="font-mono text-xs text-ink-muted">{r.number ?? "—"}</Td>
                    <Td className="text-ink-muted">{dayBR(r.issuedAt)}</Td>
                    <Td className="text-ink-muted">{dayBR(r.validUntil)}</Td>
                    <Td>
                      <div className="flex gap-1 flex-wrap">
                        <Badge tone={valid ? "success" : "danger"} dot>{valid ? "Válida" : "Vencida"}</Badge>
                        {r.retained && <Badge tone="brand">Retida</Badge>}
                      </div>
                    </Td>
                    <Td className="text-ink-muted">{r.unitName}</Td>
                  </Tr>
                );
              })
            )}
          </tbody>
        </Table>
      </TableShell>

      <Pagination
        page={list.data?.page ?? page}
        pageSize={list.data?.pageSize ?? 15}
        total={list.data?.total ?? 0}
        onPageChange={setPage}
        noun="receita(s)"
      />

      {creating && <PrescriptionFormModal patient={patient} onClose={() => setCreating(false)} />}
    </div>
  );
}
