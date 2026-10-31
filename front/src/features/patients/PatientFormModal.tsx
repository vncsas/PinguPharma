import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/design-system/components/Modal";
import { Button } from "@/design-system/components/Button";
import { Field, Input, Label } from "@/design-system/components/Input";
import { Skeleton } from "@/design-system/components/Skeleton";
import { useToast } from "@/design-system/components/Toast";
import { patientsApi, type PatientDTO } from "./api";
import { zodResolver } from "@/lib/zod-resolver";
import { errMsg, formatCns, formatCpf, isValidCns, isValidCpf, onlyDigits } from "@/lib/utils";
import { useState } from "react";

const schema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome completo").max(120),
    cpf: z.string(),
    cns: z.string(),
    birthDate: z.string().refine((v) => !v || new Date(v).getTime() <= Date.now(), "Data de nascimento no futuro"),
    phone: z.string().max(30, "Telefone muito longo"),
    email: z.string().refine((v) => !v || z.string().email().safeParse(v).success, "E-mail inválido"),
    address: z.string().max(300, "Máximo de 300 caracteres"),
    notes: z.string().max(1000, "Máximo de 1000 caracteres"),
    active: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const cpf = onlyDigits(v.cpf);
    const cns = onlyDigits(v.cns);
    if (!cpf && !cns) {
      ctx.addIssue({ code: "custom", path: ["cpf"], message: "Informe CPF ou CNS" });
    }
    if (cpf && !isValidCpf(cpf)) ctx.addIssue({ code: "custom", path: ["cpf"], message: "CPF inválido" });
    if (cns && !isValidCns(cns)) ctx.addIssue({ code: "custom", path: ["cns"], message: "CNS inválido" });
  });

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  name: "",
  cpf: "",
  cns: "",
  birthDate: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  active: true,
};

function toForm(p: PatientDTO): FormValues {
  return {
    name: p.name,
    cpf: p.cpf ? formatCpf(p.cpf) : "",
    cns: p.cns ? formatCns(p.cns) : "",
    birthDate: p.birthDate ? p.birthDate.slice(0, 10) : "",
    phone: p.phone ?? "",
    email: p.email ?? "",
    address: p.address ?? "",
    notes: p.notes ?? "",
    active: p.active,
  };
}

export function PatientFormModal({
  patientId,
  onClose,
  onSaved,
}: {
  /** Quando informado, edita o paciente (carrega os dados completos). */
  patientId?: string;
  onClose: () => void;
  onSaved?: (patient: PatientDTO) => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(patientId);

  const detail = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => patientsApi.get(patientId!),
    enabled: isEdit,
    staleTime: 0,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver<FormValues>(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (detail.data?.patient) reset(toForm(detail.data.patient));
  }, [detail.data, reset]);

  const mut = useMutation({
    mutationFn: (v: FormValues) => {
      const payload = {
        name: v.name.trim(),
        cpf: onlyDigits(v.cpf) || null,
        cns: onlyDigits(v.cns) || null,
        birthDate: v.birthDate || null,
        phone: v.phone.trim() || null,
        email: v.email.trim() || null,
        address: v.address.trim() || null,
        notes: v.notes.trim() || null,
        active: v.active,
      };
      return isEdit ? patientsApi.update(patientId!, payload) : patientsApi.create(payload);
    },
    onSuccess: ({ patient }) => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient", patientId] });
      toast.success(isEdit ? "Paciente atualizado" : "Paciente cadastrado");
      onSaved?.(patient);
      onClose();
    },
    onError: (err) => setError(errMsg(err)),
  });

  const err = (k: keyof FormValues) =>
    errors[k]?.message ? <p className="text-xs text-accent-rose pl-1">{errors[k]!.message as string}</p> : null;

  return (
    <Modal
      title={isEdit ? "Editar paciente" : "Novo paciente"}
      description="Informe ao menos CPF ou CNS (Cartão Nacional de Saúde)."
      onClose={onClose}
      className="max-w-xl"
    >
      {isEdit && detail.isLoading ? (
        <Skeleton className="h-48" />
      ) : isEdit && detail.isError ? (
        <p className="text-sm text-accent-rose">Não foi possível carregar os dados do paciente.</p>
      ) : (
        <form
          onSubmit={handleSubmit((v) => {
            setError(null);
            mut.mutate(v);
          })}
          className="space-y-4"
        >
          <Field>
            <Label>Nome completo</Label>
            <Input autoFocus {...register("name")} />
            {err("name")}
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field>
              <Label>CPF</Label>
              <Input
                inputMode="numeric"
                placeholder="000.000.000-00"
                {...register("cpf", { onChange: (e) => setValue("cpf", formatCpf(e.target.value)) })}
              />
              {err("cpf")}
            </Field>
            <Field>
              <Label>CNS</Label>
              <Input
                inputMode="numeric"
                placeholder="000 0000 0000 0000"
                {...register("cns", { onChange: (e) => setValue("cns", formatCns(e.target.value)) })}
              />
              {err("cns")}
            </Field>
            <Field>
              <Label>Data de nascimento</Label>
              <Input type="date" {...register("birthDate")} />
              {err("birthDate")}
            </Field>
            <Field>
              <Label>Telefone</Label>
              <Input {...register("phone")} />
              {err("phone")}
            </Field>
          </div>
          <Field>
            <Label>E-mail</Label>
            <Input type="email" {...register("email")} />
            {err("email")}
          </Field>
          <Field>
            <Label>Endereço</Label>
            <Input {...register("address")} />
            {err("address")}
          </Field>
          <Field>
            <Label>Observações</Label>
            <textarea
              rows={3}
              {...register("notes")}
              className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
            />
            {err("notes")}
          </Field>
          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" {...register("active")} className="size-4 accent-brand-500" />
              Paciente ativo
            </label>
          )}
          {error && (
            <p className="text-sm text-accent-rose bg-accent-rose/5 border border-accent-rose/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? "Salvando..." : isEdit ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
