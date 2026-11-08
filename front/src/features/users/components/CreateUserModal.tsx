import { Mail } from "lucide-react";
import { Controller } from "react-hook-form";
import { Button } from "@/design-system/ui/Button";
import { Dialog } from "@/design-system/ui/Dialog";
import { FormError } from "@/design-system/ui/FormError";
import { Field, Input, Label } from "@/design-system/ui/Input";
import { SegmentedControl } from "@/design-system/ui/SegmentedControl";
import { serverError, useZodForm } from "@/lib/forms";
import { roleOptions } from "../constants";
import { useCreateUser } from "../hooks";
import { createUserSchema } from "../schemas";

export function CreateUserModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const createUser = useCreateUser();
  const { register, control, handleSubmit, setError, formState } = useZodForm(createUserSchema, {
    defaultValues: { name: "", email: "", password: "", role: "SELLER" },
  });

  const submit = handleSubmit((values) =>
    createUser.mutate(values, {
      onSuccess,
      onError: (err) => setError("root", serverError(err, "Erro")),
    }),
  );

  return (
    <Dialog title="Novo usuário" onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field>
          <Label>Nome</Label>
          <Input {...register("name")} error={formState.errors.name?.message} />
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
        <Field>
          <Label>Senha (mín. 8)</Label>
          <Input
            type="password"
            autoComplete="new-password"
            {...register("password")}
            error={formState.errors.password?.message}
          />
        </Field>
        <Field>
          <Label>Papel</Label>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <SegmentedControl value={field.value} onChange={field.onChange} options={roleOptions} />
            )}
          />
        </Field>
        <FormError message={formState.errors.root?.message} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createUser.isPending}>
            {createUser.isPending ? "Criando..." : "Criar usuário"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
