import { Mail, Save, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/design-system/ui/Button";
import { FormError } from "@/design-system/ui/FormError";
import { FormSuccess } from "@/design-system/ui/FormSuccess";
import { Card } from "@/design-system/ui/GlassCard";
import { Field, Input, Label } from "@/design-system/ui/Input";
import { serverError, useZodForm } from "@/lib/forms";
import { useUpdateProfile } from "../hooks";
import { updateProfileSchema } from "../schemas";
import type { AuthUser } from "../types";

/** Use `key={user.id}` no pai: o formulário é reiniciado quando muda o usuário logado. */
export function UpdateProfileCard({
  user,
  refreshMe,
}: {
  user: AuthUser | null;
  refreshMe: () => Promise<void>;
}) {
  const [ok, setOk] = useState(false);
  const updateProfile = useUpdateProfile();
  const { register, handleSubmit, setError, formState } = useZodForm(updateProfileSchema, {
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "" },
  });

  const submit = handleSubmit((values) => {
    setOk(false);
    updateProfile.mutate(values, {
      onSuccess: async () => {
        setOk(true);
        await refreshMe();
        setTimeout(() => setOk(false), 3000);
      },
      onError: (err) => setError("root", serverError(err, "Erro")),
    });
  });

  return (
    <Card className="space-y-4">
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Dados pessoais</h2>
          <p className="text-xs text-ink-muted">Nome e e-mail que aparecem no sistema.</p>
        </div>
        <Field>
          <Label>Nome</Label>
          <Input
            {...register("name")}
            error={formState.errors.name?.message}
            leadingIcon={<UserIcon className="size-4" />}
          />
        </Field>
        <Field>
          <Label>E-mail</Label>
          <Input
            type="email"
            {...register("email")}
            error={formState.errors.email?.message}
            leadingIcon={<Mail className="size-4" />}
          />
        </Field>
        <FormError message={formState.errors.root?.message} />
        <FormSuccess message={ok ? "Dados atualizados." : undefined} />
        <div className="flex justify-end">
          <Button type="submit" disabled={updateProfile.isPending}>
            <Save className="size-4" />
            {updateProfile.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
