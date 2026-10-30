import { useState } from "react";
import { errorMessage } from "@/lib/api-client";
import { Button } from "@/design-system/ui/Button";
import { Input, Field, Label } from "@/design-system/ui/Input";
import { Dialog } from "@/design-system/ui/Dialog";
import { type UserDTO, type UserStatus } from "@/features/users/api";
import type { Role } from "@/features/auth/types";
import { useUpdateUser } from "@/features/users/hooks";
import { ROLES, STATUSES, roleLabel, statusLabel } from "@/features/users/constants";

export function EditUserModal({
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
  const [error, setError] = useState<string | null>(null);
  const mut = useUpdateUser();
  return (
    <Dialog title={`Editar ${user.name}`} onClose={onClose}>
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
        <div className="grid grid-cols-3 gap-2">
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
      {error && <p className="text-sm text-accent-rose">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={() => {
            setError(null);
            mut.mutate(
              { id: user.id, data: { name, email, role, status } },
              {
                onSuccess,
                onError: (err) => setError(errorMessage(err, "Erro")),
              },
            );
          }}
          disabled={mut.isPending}
        >
          {mut.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </Dialog>
  );
}
