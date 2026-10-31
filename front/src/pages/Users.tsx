import { useConfirm } from "@/design-system/components/ConfirmDialog";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Input, Field, Label } from "@/design-system/components/Input";
import { Modal } from "@/design-system/components/Modal";
import { Badge } from "@/design-system/components/Badge";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/components/Table";
import { Skeleton } from "@/design-system/components/Skeleton";
import {
  usersApi,
  type Role,
  type UserDTO,
  type UserStatus,
} from "@/features/users/api";
import { useAuth } from "@/lib/auth-context";
import { ALL_ROLES, ROLE_LABEL } from "@/lib/roles";
import { useUnits } from "@/features/units/api";
import { useToast } from "@/design-system/components/Toast";
import { dateBR } from "@/lib/utils";
import {
  KeyRound,
  Mail,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";

const ROLES: Role[] = ALL_ROLES;
const STATUSES: UserStatus[] = ["ACTIVE", "INACTIVE", "BLOCKED"];

const roleLabel = ROLE_LABEL;

const statusLabel: Record<UserStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  BLOCKED: "Bloqueado",
};

export default function UsersPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const { user: current } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<UserDTO | null>(null);
  const [resetTarget, setResetTarget] = useState<UserDTO | null>(null);

  const unitsQuery = useUnits();
  const list = useQuery({
    queryKey: ["users", search, roleFilter],
    queryFn: () => usersApi.list({ search: search || undefined, role: roleFilter }),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário excluído");
    },
    onError: (err: Error) => toast.error("Não foi possível excluir", err.message),
  });

  const users = list.data?.users ?? [];
  const unitName = (id: string | null) =>
    id ? (unitsQuery.data?.units.find((u) => u.id === id)?.name ?? "—") : "Todas";

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
        <div className="flex gap-2 items-center flex-wrap">
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
              <Th>Unidade</Th>
              <Th>Status</Th>
              <Th>MFA</Th>
              <Th>Último login</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Tr key={i}>
                  <Td colSpan={8}><Skeleton className="h-4" /></Td>
                </Tr>
              ))
            ) : users.length === 0 ? (
              <Tr>
                <Td colSpan={8} className="text-center text-ink-muted py-12">
                  Nenhum usuário encontrado.
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
                  <Td className="text-ink-muted">{unitName(u.unitId)}</Td>
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
                        if (await confirm({ title: `Excluir usuário ${u.name}?`, confirmLabel: "Excluir", tone: "danger" }))
                          removeMut.mutate(u.id);
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
          onSuccess={() => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey: ["users"] });
          }}
        />
      )}
      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["users"] });
          }}
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

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-8 px-3 text-xs font-medium rounded-lg border ${
        active
          ? "bg-brand-500 text-white border-brand-500"
          : "bg-white text-ink border-line-strong hover:bg-surface-alt"
      }`}
    >
      {children}
    </button>
  );
}

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("DISPENSER");
  const [unitId, setUnitId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () => usersApi.create({ name, email, password, role, unitId: role === "ADMIN" ? undefined : unitId }),
    onSuccess,
    onError: (err: any) => setError(err.message ?? "Erro"),
  });
  return (
    <Modal title="Novo usuário" onClose={onClose}>
      <Field>
        <Label>Nome</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field>
        <Label>E-mail</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leadingIcon={<Mail className="size-4" />}
        />
      </Field>
      <Field>
        <Label>Senha (mín. 8)</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Field>
        <Label>Papel</Label>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`h-10 rounded-lg text-sm font-medium border ${
                role === r
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-white text-ink border-line-strong hover:bg-surface-alt"
              }`}
            >
              {roleLabel[r]}
            </button>
          ))}
        </div>
      </Field>
      {role !== "ADMIN" && (
        <Field>
          <Label>Unidade</Label>
          <UnitSelect value={unitId} onChange={setUnitId} />
        </Field>
      )}
      {error && <p className="text-sm text-accent-rose">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          onClick={() => {
            setError(null);
            mut.mutate();
          }}
          disabled={mut.isPending || name.length < 2 || password.length < 8 || (role !== "ADMIN" && !unitId)}
        >
          {mut.isPending ? "Criando..." : "Criar usuário"}
        </Button>
      </div>
    </Modal>
  );
}

function EditUserModal({
  user,
  onClose,
  onSuccess,
}: {
  user: UserDTO;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<Role>(user.role);
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [unitId, setUnitId] = useState(user.unitId ?? "");
  const [error, setError] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () => usersApi.update(user.id, { name, email, role, status, unitId: role === "ADMIN" ? null : unitId || null }),
    onSuccess,
    onError: (err: any) => setError(err.message ?? "Erro"),
  });
  return (
    <Modal title={`Editar ${user.name}`} onClose={onClose}>
      <Field>
        <Label>Nome</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field>
        <Label>E-mail</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field>
        <Label>Papel</Label>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`h-10 rounded-lg text-sm font-medium border ${
                role === r
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-white text-ink border-line-strong hover:bg-surface-alt"
              }`}
            >
              {roleLabel[r]}
            </button>
          ))}
        </div>
      </Field>
      <Field>
        <Label>Status</Label>
        <div className="grid grid-cols-3 gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`h-10 rounded-lg text-sm font-medium border ${
                status === s
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-white text-ink border-line-strong hover:bg-surface-alt"
              }`}
            >
              {statusLabel[s]}
            </button>
          ))}
        </div>
      </Field>
      {role !== "ADMIN" && (
        <Field>
          <Label>Unidade</Label>
          <UnitSelect value={unitId} onChange={setUnitId} />
        </Field>
      )}
      {error && <p className="text-sm text-accent-rose">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => { setError(null); mut.mutate(); }} disabled={mut.isPending || (role !== "ADMIN" && !unitId)}>
          {mut.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </Modal>
  );
}

function ResetPasswordModal({
  user,
  onClose,
  onSuccess,
}: {
  user: UserDTO;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () => usersApi.resetPassword(user.id, password),
    onSuccess,
    onError: (err: any) => setError(err.message ?? "Erro"),
  });
  return (
    <Modal title={`Nova senha para ${user.name}`} onClose={onClose}>
      <p className="text-sm text-ink-muted">
        Mínimo 8 caracteres. O usuário deve trocar após primeiro login.
      </p>
      <Field>
        <Label>Nova senha</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {error && <p className="text-sm text-accent-rose">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => { setError(null); mut.mutate(); }} disabled={mut.isPending || password.length < 8}>
          <KeyRound className="size-4" />
          {mut.isPending ? "Salvando..." : "Redefinir senha"}
        </Button>
      </div>
    </Modal>
  );
}

function UnitSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const units = useUnits({ activeOnly: true });
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm outline-none focus:border-brand-500"
    >
      <option value="">Selecione a unidade</option>
      {units.data?.units.map((u) => (
        <option key={u.id} value={u.id}>{u.name}</option>
      ))}
    </select>
  );
}
