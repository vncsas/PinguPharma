import { Controller } from "react-hook-form";
import { Button } from "@/design-system/ui/Button";
import { Dialog } from "@/design-system/ui/Dialog";
import { FormError } from "@/design-system/ui/FormError";
import { Field, Input, Label } from "@/design-system/ui/Input";
import { SegmentedControl } from "@/design-system/ui/SegmentedControl";
import { serverError, useZodForm } from "@/lib/forms";
import type { UserDTO } from "../api";
import { roleOptions, statusOptions } from "../constants";
import { useUpdateUser } from "../hooks";
import { editUserSchema } from "../schemas";

export function EditUserModal({
  user,
  onClose,
  onSuccess,
}: {
  user: UserDTO;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const updateUser = useUpdateUser();
  const { register, control, handleSubmit, setError, formState } = useZodForm(editUserSchema, {
    defaultValues: { name: user.name, email: user.email, role: user.role, status: user.status },
  });

  const submit = handleSubmit((data) =>
    updateUser.mutate(
      { id: user.id, data },
      { onSuccess, onError: (err) => setError("root", serverError(err, "Erro")) },
    ),
  );

  return (
    <Dialog title={`Editar ${user.name}`} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field>
          <Label>Nome</Label>
          <Input {...register("name")} error={formState.errors.name?.message} />
        </Field>
        <Field>
          <Label>E-mail</Label>
          <Input type="email" {...register("email")} error={formState.errors.email?.message} />
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
        <Field>
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <SegmentedControl value={field.value} onChange={field.onChange} options={statusOptions} />
            )}
          />
        </Field>
        <FormError message={formState.errors.root?.message} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateUser.isPending}>
            {updateUser.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
