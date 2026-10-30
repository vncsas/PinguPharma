import { useState } from "react";
import { errorMessage } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Field, Input, Label } from "@/design-system/components/Input";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/components/Table";
import { Skeleton } from "@/design-system/components/Skeleton";
import { customersApi, type CustomerDTO, type CustomerInput } from "@/features/customers/api";
import { Mail, Phone, Search, Trash2, UserPlus, X } from "lucide-react";

export default function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<CustomerDTO | null>(null);

  const list = useQuery({
    queryKey: ["customers-list", search],
    queryFn: () => customersApi.list(search),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers-list"] }),
  });

  return (
    <div className="space-y-6">
      <Topbar
        title="Clientes"
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <UserPlus className="size-4" /> Novo cliente
          </Button>
        }
      />

      <Card>
        <Input
          leadingIcon={<Search className="size-4" />}
          placeholder="Buscar por nome, CPF ou telefone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>Documento</Th>
              <Th>Contato</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Tr key={i}><Td colSpan={4}><Skeleton className="h-4" /></Td></Tr>
              ))
            ) : (list.data?.customers.length ?? 0) === 0 ? (
              <Tr>
                <Td colSpan={4} className="text-center text-ink-muted py-12">
                  Nenhum cliente cadastrado ainda.
                </Td>
              </Tr>
            ) : (
              list.data!.customers.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-ink text-white grid place-items-center text-xs font-semibold">
                        {c.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <p className="text-sm font-medium">{c.name}</p>
                    </div>
                  </Td>
                  <Td className="font-mono text-xs text-ink-muted">{c.document ?? "—"}</Td>
                  <Td className="text-sm text-ink-muted">
                    <div className="flex flex-col">
                      {c.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3" /> {c.phone}
                        </span>
                      )}
                      {c.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="size-3" /> {c.email}
                        </span>
                      )}
                      {!c.phone && !c.email && <span>—</span>}
                    </div>
                  </Td>
                  <Td className="text-right whitespace-nowrap">
                    <button
                      onClick={() => setEditing(c)}
                      className="text-xs font-medium text-brand-500 hover:underline mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir ${c.name}?`)) removeMut.mutate(c.id);
                      }}
                      className="text-xs font-medium text-accent-rose hover:underline"
                    >
                      <Trash2 className="inline size-3.5" />
                    </button>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </TableShell>

      {showCreate && (
        <CustomerFormModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey: ["customers-list"] });
          }}
        />
      )}
      {editing && (
        <CustomerFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["customers-list"] });
          }}
        />
      )}
    </div>
  );
}

function CustomerFormModal({
  initial,
  onClose,
  onSuccess,
}: {
  initial?: CustomerDTO;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<CustomerInput>({
    name: initial?.name ?? "",
    document: initial?.document ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      isEdit
        ? customersApi.update(initial!.id, form)
        : customersApi.create(form),
    onSuccess,
    onError: (err) => setError(errorMessage(err, "Erro")),
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md !p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h3 className="text-base font-semibold text-ink">
            {isEdit ? `Editar ${initial!.name}` : "Novo cliente"}
          </h3>
          <button onClick={onClose} className="grid size-8 place-items-center rounded hover:bg-surface-alt">
            <X className="size-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Field>
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field>
            <Label>Documento (CPF/CNPJ)</Label>
            <Input
              value={form.document ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, document: e.target.value }))}
            />
          </Field>
          <Field>
            <Label>Telefone</Label>
            <Input
              value={form.phone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </Field>
          <Field>
            <Label>E-mail</Label>
            <Input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </Field>
          {error && <p className="text-sm text-accent-rose">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              onClick={() => { setError(null); mut.mutate(); }}
              disabled={mut.isPending || form.name.length < 2}
            >
              {mut.isPending ? "Salvando..." : isEdit ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
