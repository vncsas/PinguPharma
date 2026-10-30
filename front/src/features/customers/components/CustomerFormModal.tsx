import { useState } from "react";
import { errorMessage } from "@/lib/api-client";
import { Button } from "@/design-system/ui/Button";
import { Field, Input, Label } from "@/design-system/ui/Input";
import { Dialog } from "@/design-system/ui/Dialog";
import type { CustomerDTO, CustomerInput } from "@/features/customers/api";
import { useCreateCustomer, useUpdateCustomer } from "@/features/customers/hooks";

export function CustomerFormModal({
  initial,
  onClose,
  onSuccess,
}: {
  initial?: CustomerDTO;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<CustomerInput>({
    name: initial?.name ?? "",
    document: initial?.document ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateCustomer();
  const updateMut = useUpdateCustomer();
  const mut = isEdit ? updateMut : createMut;

  return (
    <Dialog title={isEdit ? `Editar ${initial!.name}` : "Novo cliente"} onClose={onClose}>
      <Field>
        <Label>Nome</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </Field>
      <Field>
        <Label>Documento (CPF/CNPJ)</Label>
        <Input
          value={form.document ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, document: e.target.value }))}
        />
      </Field>
      <Field>
        <Label>Telefone</Label>
        <Input
          value={form.phone ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
      </Field>
      <Field>
        <Label>E-mail</Label>
        <Input
          type="email"
          value={form.email ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </Field>
      {error && <p className="text-sm text-accent-rose">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={() => {
            setError(null);
            const callbacks = {
              onSuccess,
              onError: (err: unknown) => setError(errorMessage(err, "Erro")),
            };
            if (initial) updateMut.mutate({ id: initial.id, data: form }, callbacks);
            else createMut.mutate(form, callbacks);
          }}
          disabled={mut.isPending || form.name.length < 2}
        >
          {mut.isPending ? "Salvando..." : isEdit ? "Salvar" : "Cadastrar"}
        </Button>
      </div>
    </Dialog>
  );
}
