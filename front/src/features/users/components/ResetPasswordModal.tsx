import { useState } from "react";
import { errorMessage } from "@/lib/api-client";
import { Button } from "@/design-system/ui/Button";
import { Input, Field, Label } from "@/design-system/ui/Input";
import { Dialog } from "@/design-system/ui/Dialog";
import { type UserDTO } from "@/features/users/api";
import { useResetUserPassword } from "@/features/users/hooks";
import { KeyRound } from "lucide-react";

export function ResetPasswordModal({
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
  const mut = useResetUserPassword();
  return (
    <Dialog title={`Nova senha para ${user.name}`} onClose={onClose}>
      <p className="text-sm text-ink-muted">
        Mínimo 8 caracteres. O usuário deve trocar após primeiro login.
      </p>
      <Field>
        <Label>Nova senha</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
              { id: user.id, password },
              {
                onSuccess,
                onError: (err) => setError(errorMessage(err, "Erro")),
              },
            );
          }}
          disabled={mut.isPending || password.length < 8}
        >
          <KeyRound className="size-4" />
          {mut.isPending ? "Salvando..." : "Redefinir senha"}
        </Button>
      </div>
    </Dialog>
  );
}
