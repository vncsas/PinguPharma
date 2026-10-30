import { useState } from "react";
import { Topbar } from "@/design-system/layout/Topbar";
import { Card } from "@/design-system/ui/GlassCard";
import { Button } from "@/design-system/ui/Button";
import { Input } from "@/design-system/ui/Input";
import { Badge } from "@/design-system/ui/Badge";
import { useConfirm } from "@/design-system/ui/ConfirmDialog";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/ui/Table";
import { EmptyState } from "@/design-system/ui/EmptyState";
import { ErrorState } from "@/design-system/ui/ErrorState";
import { Skeleton } from "@/design-system/ui/Skeleton";
import { type UserDTO } from "@/features/users/api";
import type { Role } from "@/features/auth/types";
import { useDeleteUser, useUsers } from "@/features/users/hooks";
import { ROLES, roleLabel, statusLabel } from "@/features/users/constants";
import { useAuth } from "@/lib/auth-context";
import { dateBR } from "@/lib/utils";
import { KeyRound, Search, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { Chip } from "@/design-system/ui/Chip";
import { CreateUserModal } from "../components/CreateUserModal";
import { EditUserModal } from "../components/EditUserModal";
import { ResetPasswordModal } from "../components/ResetPasswordModal";

export default function UsersPage() {
  const confirm = useConfirm();
  const { user: current } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<UserDTO | null>(null);
  const [resetTarget, setResetTarget] = useState<UserDTO | null>(null);

  const list = useUsers({ search: search || undefined, role: roleFilter });
  const removeMut = useDeleteUser();

  const users = list.data?.users ?? [];

  return (
    <div className="space-y-6">
      <Topbar
        title="Usuários"
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <UserPlus className="size-4" /> Novo usuário
          </Button>
        }
      />

      <Card className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 max-w-md">
          <Input
            leadingIcon={<Search className="size-4" />}
            placeholder="Buscar por nome ou e-mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-ink-muted">Papel:</span>
          {ROLES.map((r) => (
            <Chip
              key={r}
              active={roleFilter === r}
              onClick={() => setRoleFilter(roleFilter === r ? undefined : r)}
            >
              {roleLabel[r]}
            </Chip>
          ))}
        </div>
      </Card>

      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Usuário</Th>
              <Th>E-mail</Th>
              <Th>Papel</Th>
              <Th>Status</Th>
              <Th>MFA</Th>
              <Th>Último login</Th>
              <Th className="text-right">Ações</Th>
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
              Array.from({ length: 4 }).map((_, i) => (
                <Tr key={i}>
                  <Td colSpan={7}><Skeleton className="h-4" /></Td>
                </Tr>
              ))
            ) : users.length === 0 ? (
              <Tr>
                <Td colSpan={7}>
                  <EmptyState title="Nenhum usuário encontrado." />
                </Td>
              </Tr>
            ) : (
              users.map((u) => (
                <Tr key={u.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-ink text-white grid place-items-center text-xs font-semibold">
                        {u.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{u.name}</p>
                        <p className="text-xs text-ink-muted">
                          Criado {dateBR(u.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-ink-muted">{u.email}</Td>
                  <Td>
                    <Badge tone="brand">{roleLabel[u.role]}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={u.status === "ACTIVE" ? "success" : u.status === "BLOCKED" ? "danger" : "warn"} dot>
                      {statusLabel[u.status]}
                    </Badge>
                  </Td>
                  <Td>
                    {u.twoFactorEnabled ? (
                      <span className="inline-flex items-center gap-1 text-xs text-accent-success">
                        <ShieldCheck className="size-3.5" /> Ativo
                      </span>
                    ) : (
                      <span className="text-xs text-ink-subtle">—</span>
                    )}
                  </Td>
                  <Td className="text-xs text-ink-muted">
                    {u.lastLoginAt ? dateBR(u.lastLoginAt) : "nunca"}
                  </Td>
                  <Td className="text-right whitespace-nowrap">
                    <button
                      onClick={() => setEditing(u)}
                      className="text-xs font-medium text-brand-500 hover:underline mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setResetTarget(u)}
                      className="text-xs font-medium text-ink-muted hover:text-ink mr-3 inline-flex items-center gap-1"
                    >
                      <KeyRound className="size-3.5" /> Senha
                    </button>
                    <button
                      disabled={u.id === current?.id}
                      onClick={async () => {
                        if (await confirm({ title: `Excluir usuário ${u.name}?`, confirmLabel: "Excluir", danger: true })) {
                          removeMut.mutate(u.id);
                        }
                      }}
                      className="text-xs font-medium text-accent-rose hover:underline disabled:text-ink-subtle disabled:no-underline"
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
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => setShowCreate(false)}
        />
      )}
      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => setEditing(null)}
        />
      )}
      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onSuccess={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}

