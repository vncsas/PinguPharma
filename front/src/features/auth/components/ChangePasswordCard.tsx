import { useState } from "react";
import { errorMessage } from "@/lib/api-client";
import { Card } from "@/design-system/ui/GlassCard";
import { Button } from "@/design-system/ui/Button";
import { Field, Input, Label } from "@/design-system/ui/Input";
import { useChangePassword } from "@/features/auth/hooks";
import { KeyRound } from "lucide-react";

export function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mut = useChangePassword();

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-ink">Trocar senha</h2>
        <p className="text-xs text-ink-muted">
          Mínimo 8 caracteres. Recomenda-se ativar MFA também.
        </p>
      </div>
      <Field>
        <Label>Senha atual</Label>
        <Input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          leadingIcon={<KeyRound className="size-4" />}
        />
      </Field>
      <Field>
        <Label>Nova senha</Label>
        <Input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          leadingIcon={<KeyRound className="size-4" />}
        />
      </Field>
      <Field>
        <Label>Confirmar nova senha</Label>
        <Input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          leadingIcon={<KeyRound className="size-4" />}
        />
      </Field>
      {error && (
        <p className="text-sm text-accent-rose bg-accent-rose/5 border border-accent-rose/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {ok && (
        <p className="text-sm text-accent-success bg-accent-success/5 border border-accent-success/20 rounded-lg px-3 py-2">
          Senha atualizada.
        </p>
      )}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setError(null);
            if (next !== confirm) {
              setError("Senhas não coincidem");
              return;
            }
            mut.mutate(
              { current, next },
              {
                onSuccess: () => {
                  setOk(true);
                  setCurrent("");
                  setNext("");
                  setConfirm("");
                  setTimeout(() => setOk(false), 3000);
                },
                onError: (err) => setError(errorMessage(err, "Erro")),
              },
            );
          }}
          disabled={mut.isPending || current.length < 1 || next.length < 8}
        >
          <KeyRound className="size-4" />
          {mut.isPending ? "Salvando..." : "Trocar senha"}
        </Button>
      </div>
    </Card>
  );
}
