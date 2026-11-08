import { useState } from "react";
import { Topbar } from "@/design-system/layout/Topbar";
import { Card } from "@/design-system/ui/GlassCard";
import { Button } from "@/design-system/ui/Button";
import { Input } from "@/design-system/ui/Input";
import { useConfirm } from "@/design-system/ui/ConfirmDialog";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/ui/Table";
import { EmptyState } from "@/design-system/ui/EmptyState";
import { ErrorState } from "@/design-system/ui/ErrorState";
import { Skeleton } from "@/design-system/ui/Skeleton";
import type { CustomerDTO } from "@/features/customers/api";
import { useCustomers, useDeleteCustomer } from "@/features/customers/hooks";
import { Mail, Phone, Search, Trash2, UserPlus } from "lucide-react";
import { CustomerFormModal } from "../components/CustomerFormModal";

export default function CustomersPage() {
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<CustomerDTO | null>(null);

  const list = useCustomers(search);
  const removeMut = useDeleteCustomer();

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
            {list.isError ? (
              <Tr>
                <Td colSpan={4}>
                  <ErrorState error={list.error} onRetry={() => list.refetch()} />
                </Td>
              </Tr>
            ) : list.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Tr key={i}><Td colSpan={4}><Skeleton className="h-4" /></Td></Tr>
              ))
            ) : (list.data?.customers.length ?? 0) === 0 ? (
              <Tr>
                <Td colSpan={4}>
                  <EmptyState title="Nenhum cliente cadastrado ainda." />
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
                      onClick={async () => {
                        if (await confirm({ title: `Excluir ${c.name}?`, confirmLabel: "Excluir", danger: true })) {
                          removeMut.mutate(c.id);
                        }
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
          onSuccess={() => setShowCreate(false)}
        />
      )}
      {editing && (
        <CustomerFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => setEditing(null)}
        />
      )}
    </div>
  );
}

