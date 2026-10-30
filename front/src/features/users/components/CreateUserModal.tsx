import { useState } from "react";
import { errorMessage } from "@/lib/api-client";
import { Button } from "@/design-system/ui/Button";
import { Input, Field, Label } from "@/design-system/ui/Input";
import { Dialog } from "@/design-system/ui/Dialog";
import type { Role } from "@/features/auth/types";
import { useCreateUser } from "@/features/users/hooks";
import { ROLES, roleLabel } from "@/features/users/constants";
import { Mail } from "lucide-react";

export function CreateUserModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("SELLER");
  const [error, setError] = useState<string | null>(null);
  const mut = useCreateUser();
  return (
    <Dialog title="Novo usuário" onClose={onClose}>
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
      {error && <p className="text-sm text-accent-rose">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={() => {
            setError(null);
            mut.mutate(
              { name, email, password, role },
              {
                onSuccess,
                onError: (err) => setError(errorMessage(err, "Erro")),
              },
            );
          }}
          disabled={mut.isPending || name.length < 2 || password.length < 8}
        >
          {mut.isPending ? "Criando..." : "Criar usuário"}
        </Button>
      </div>
    </Dialog>
  );
}
