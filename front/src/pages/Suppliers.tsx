import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Truck } from "lucide-react";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Field, Input, Label } from "@/design-system/components/Input";
import { Modal } from "@/design-system/components/Modal";
import { Badge } from "@/design-system/components/Badge";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/components/Table";
import { Skeleton } from "@/design-system/components/Skeleton";
import { useToast } from "@/design-system/components/Toast";
import {
  SUPPLIER_TYPE_LABEL,
  suppliersApi,
  type SupplierDTO,
  type SupplierType,
} from "@/features/suppliers/api";
import { errMsg } from "@/lib/utils";

const TYPES = Object.keys(SUPPLIER_TYPE_LABEL) as SupplierType[];

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SupplierDTO | null>(null);
  const list = useQuery({
    queryKey: ["suppliers", search],
    queryFn: () => suppliersApi.list({ search: search || undefined }),
  });
  const suppliers = list.data?.suppliers ?? [];

  return (
    <div className="space-y-6">
      <Topbar
        title="Fornecedores"
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Novo fornecedor
          </Button>
        }
      />

      <Card>
        <Input
          leadingIcon={<Search className="size-4" />}
          placeholder="Buscar por nome ou CNPJ"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Fornecedor</Th>
              <Th>Origem</Th>
              <Th>CNPJ</Th>
              <Th>Situação</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Tr key={i}><Td colSpan={5}><Skeleton className="h-4" /></Td></Tr>
              ))
            ) : list.isError ? (
              <Tr><Td colSpan={5} className="text-center text-accent-rose py-12">Não foi possível carregar os fornecedores.</Td></Tr>
            ) : suppliers.length === 0 ? (
              <Tr><Td colSpan={5} className="text-center text-ink-muted py-12">Nenhum fornecedor cadastrado.</Td></Tr>
            ) : (
              suppliers.map((s) => (
                <Tr key={s.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-brand-50 text-brand-600 grid place-items-center">
                        <Truck className="size-4" />
                      </div>
                      <p className="font-medium">{s.name}</p>
                    </div>
                  </Td>
                  <Td>{SUPPLIER_TYPE_LABEL[s.type]}</Td>
                  <Td className="font-mono text-xs text-ink-muted">{s.cnpj ?? "—"}</Td>
                  <Td>
                    <Badge tone={s.active ? "success" : "neutral"} dot>{s.active ? "Ativo" : "Inativo"}</Badge>
                  </Td>
                  <Td className="text-right">
                    <button onClick={() => setEditing(s)} className="text-xs font-medium text-brand-500 hover:underline">
                      Editar
                    </button>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </TableShell>

      {creating && <SupplierModal onClose={() => setCreating(false)} />}
      {editing && <SupplierModal initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function SupplierModal({ initial, onClose }: { initial?: SupplierDTO; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [cnpj, setCnpj] = useState(initial?.cnpj ?? "");
  const [type, setType] = useState<SupplierType>(initial?.type ?? "BIDDING");
  const [active, setActive] = useState(initial?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => {
      const data = { name: name.trim(), cnpj: cnpj.trim() || null, type, active };
      return initial ? suppliersApi.update(initial.id, data) : suppliersApi.create(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success(initial ? "Fornecedor atualizado" : "Fornecedor cadastrado");
      onClose();
    },
    onError: (err) => setError(errMsg(err)),
  });

  return (
    <Modal title={initial ? `Editar ${initial.name}` : "Novo fornecedor"} onClose={onClose}>
      <Field>
        <Label>Nome</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <Label>Origem</Label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SupplierType)}
            className="h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm outline-none focus:border-brand-500"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{SUPPLIER_TYPE_LABEL[t]}</option>
            ))}
          </select>
        </Field>
        <Field>
          <Label>CNPJ</Label>
          <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-brand-500" />
        Fornecedor ativo
      </label>
      {error && <p className="text-sm text-accent-rose">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          onClick={() => {
            setError(null);
            mut.mutate();
          }}
          disabled={mut.isPending || name.trim().length < 2}
        >
          {mut.isPending ? "Salvando..." : initial ? "Salvar" : "Cadastrar"}
        </Button>
      </div>
    </Modal>
  );
}
