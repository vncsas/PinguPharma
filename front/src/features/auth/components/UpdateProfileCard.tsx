import { useState } from "react";
import { errorMessage } from "@/lib/api-client";
import { Card } from "@/design-system/ui/GlassCard";
import { Button } from "@/design-system/ui/Button";
import { Field, Input, Label } from "@/design-system/ui/Input";
import { useUpdateProfile } from "@/features/auth/hooks";
import type { AuthUser } from "@/features/auth/types";
import { Mail, Save, User as UserIcon } from "lucide-react";

/** Use `key={user.id}` no pai: o formulário é reiniciado quando muda o usuário logado. */
export function UpdateProfileCard({
  user,
  refreshMe,
}: {
  user: AuthUser | null;
  refreshMe: () => Promise<void>;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mut = useUpdateProfile();

  function save() {
    setError(null);
    mut.mutate(
      { name, email },
      {
        onSuccess: async () => {
          setOk(true);
          await refreshMe();
          setTimeout(() => setOk(false), 3000);
        },
        onError: (err) => setError(errorMessage(err, "Erro")),
      },
    );
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-ink">Dados pessoais</h2>
        <p className="text-xs text-ink-muted">Nome e e-mail que aparecem no sistema.</p>
      </div>
      <Field>
        <Label>Nome</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          leadingIcon={<UserIcon className="size-4" />}
        />
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
      {error && (
        <p className="text-sm text-accent-rose bg-accent-rose/5 border border-accent-rose/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {ok && (
        <p className="text-sm text-accent-success bg-accent-success/5 border border-accent-success/20 rounded-lg px-3 py-2">
          Dados atualizados.
        </p>
      )}
      <div className="flex justify-end">
        <Button onClick={save} disabled={mut.isPending || name.length < 2 || !email.includes("@")}>
          <Save className="size-4" />
          {mut.isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </Card>
  );
}
