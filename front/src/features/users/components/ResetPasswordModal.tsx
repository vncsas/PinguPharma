import { KeyRound } from "lucide-react";
import { Button } from "@/design-system/ui/Button";
import { Dialog } from "@/design-system/ui/Dialog";
import { FormError } from "@/design-system/ui/FormError";
import { Field, Input, Label } from "@/design-system/ui/Input";
import { serverError, useZodForm } from "@/lib/forms";
import type { UserDTO } from "../api";
import { useResetUserPassword } from "../hooks";
import { resetUserPasswordSchema } from "../schemas";

export function ResetPasswordModal({
  user,
  onClose,
  onSuccess,
}: {
  user: UserDTO;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const resetPassword = useResetUserPassword();
  const { register, handleSubmit, setError, formState } = useZodForm(resetUserPasswordSchema, {
    defaultValues: { password: "" },
  });

  const submit = handleSubmit(({ password }) =>
    resetPassword.mutate(
      { id: user.id, password },
      { onSuccess, onError: (err) => setError("root", serverError(err, "Erro")) },
    ),
  );

  return (
    <Dialog title={`Nova senha para ${user.name}`} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <p className="text-sm text-ink-muted">
          Mínimo 8 caracteres. O usuário deve trocar após primeiro login.
        </p>
        <Field>
          <Label>Nova senha</Label>
          <Input
            type="password"
            autoComplete="new-password"
            {...register("password")}
            error={formState.errors.password?.message}
          />
        </Field>
        <FormError message={formState.errors.root?.message} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={resetPassword.isPending}>
            <KeyRound className="size-4" />
            {resetPassword.isPending ? "Salvando..." : "Redefinir senha"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
