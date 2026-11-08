import { Button } from "@/design-system/ui/Button";
import { Dialog } from "@/design-system/ui/Dialog";
import { FormError } from "@/design-system/ui/FormError";
import { Field, Input, Label } from "@/design-system/ui/Input";
import { serverError, useZodForm } from "@/lib/forms";
import type { CustomerDTO } from "../api";
import { useCreateCustomer, useUpdateCustomer } from "../hooks";
import { customerSchema, toCustomerInput } from "../schemas";

export function CustomerFormModal({
  initial,
  onClose,
  onSuccess,
}: {
  initial?: CustomerDTO;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const saving = createCustomer.isPending || updateCustomer.isPending;
  const { register, handleSubmit, setError, formState } = useZodForm(customerSchema, {
    defaultValues: {
      name: initial?.name ?? "",
      document: initial?.document ?? "",
      phone: initial?.phone ?? "",
      email: initial?.email ?? "",
    },
  });

  const submit = handleSubmit((values) => {
    const data = toCustomerInput(values);
    const callbacks = {
      onSuccess,
      onError: (err: unknown) => setError("root", serverError(err, "Erro")),
    };
    if (initial) updateCustomer.mutate({ id: initial.id, data }, callbacks);
    else createCustomer.mutate(data, callbacks);
  });

  return (
    <Dialog title={initial ? `Editar ${initial.name}` : "Novo cliente"} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field>
          <Label>Nome</Label>
          <Input {...register("name")} error={formState.errors.name?.message} />
        </Field>
        <Field>
          <Label>Documento (CPF/CNPJ)</Label>
          <Input {...register("document")} error={formState.errors.document?.message} />
        </Field>
        <Field>
          <Label>Telefone</Label>
          <Input {...register("phone")} error={formState.errors.phone?.message} />
        </Field>
        <Field>
          <Label>E-mail</Label>
          <Input type="email" {...register("email")} error={formState.errors.email?.message} />
        </Field>
        <FormError message={formState.errors.root?.message} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : initial ? "Salvar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
