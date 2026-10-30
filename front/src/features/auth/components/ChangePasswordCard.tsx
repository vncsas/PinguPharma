import { KeyRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/design-system/ui/Button";
import { FormError } from "@/design-system/ui/FormError";
import { FormSuccess } from "@/design-system/ui/FormSuccess";
import { Card } from "@/design-system/ui/GlassCard";
import { Field, Input, Label } from "@/design-system/ui/Input";
import { serverError, useZodForm } from "@/lib/forms";
import { useChangePassword } from "../hooks";
import { changePasswordSchema } from "../schemas";

export function ChangePasswordCard() {
  const [ok, setOk] = useState(false);
  const changePassword = useChangePassword();
  const { register, handleSubmit, reset, setError, formState } = useZodForm(changePasswordSchema, {
    defaultValues: { current: "", next: "", confirm: "" },
  });

  const submit = handleSubmit(({ current, next }) => {
    setOk(false);
    changePassword.mutate(
      { current, next },
      {
        onSuccess: () => {
          setOk(true);
          reset();
          setTimeout(() => setOk(false), 3000);
        },
        onError: (err) => setError("root", serverError(err, "Erro")),
      },
    );
  });

  return (
    <Card className="space-y-4">
      <form onSubmit={submit} noValidate className="space-y-4">
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
            autoComplete="current-password"
            {...register("current")}
            error={formState.errors.current?.message}
            leadingIcon={<KeyRound className="size-4" />}
          />
        </Field>
        <Field>
          <Label>Nova senha</Label>
          <Input
            type="password"
            autoComplete="new-password"
            {...register("next")}
            error={formState.errors.next?.message}
            leadingIcon={<KeyRound className="size-4" />}
          />
        </Field>
        <Field>
          <Label>Confirmar nova senha</Label>
          <Input
            type="password"
            autoComplete="new-password"
            {...register("confirm")}
            error={formState.errors.confirm?.message}
            leadingIcon={<KeyRound className="size-4" />}
          />
        </Field>
        <FormError message={formState.errors.root?.message} />
        <FormSuccess message={ok ? "Senha atualizada." : undefined} />
        <div className="flex justify-end">
          <Button type="submit" disabled={changePassword.isPending}>
            <KeyRound className="size-4" />
            {changePassword.isPending ? "Salvando..." : "Trocar senha"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
