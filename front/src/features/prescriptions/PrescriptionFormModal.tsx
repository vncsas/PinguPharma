import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/design-system/components/Modal";
import { Button } from "@/design-system/components/Button";
import { Field, Input, Label } from "@/design-system/components/Input";
import { useToast } from "@/design-system/components/Toast";
import { UnitRequiredNotice } from "@/design-system/components/UnitRequiredNotice";
import { PatientPicker } from "@/features/patients/PatientPicker";
import type { PatientDTO } from "@/features/patients/api";
import { COUNCIL_LABEL, prescriptionsApi, type PrescriberCouncil, type PrescriptionDTO } from "./api";
import { useUnit } from "@/lib/unit-context";
import { zodResolver } from "@/lib/zod-resolver";
import { errMsg } from "@/lib/utils";

const COUNCILS = Object.keys(COUNCIL_LABEL) as PrescriberCouncil[];

const schema = z
  .object({
    prescriberName: z.string().trim().min(2, "Informe o nome do prescritor").max(120),
    prescriberCouncil: z.enum(["CRM", "CRO", "COREN", "OTHER"]),
    prescriberCouncilNumber: z.string().trim().min(1, "Informe o número do conselho").max(30),
    number: z.string().max(40, "Máximo de 40 caracteres"),
    issuedAt: z.string().min(1, "Informe a data de emissão"),
    validUntil: z.string().min(1, "Informe a validade"),
    retained: z.boolean(),
    notes: z.string().max(1000, "Máximo de 1000 caracteres"),
  })
  .superRefine((v, ctx) => {
    if (v.issuedAt && v.validUntil && v.validUntil < v.issuedAt) {
      ctx.addIssue({ code: "custom", path: ["validUntil"], message: "A validade deve ser após a emissão" });
    }
    if (v.issuedAt && new Date(`${v.issuedAt}T00:00:00`).getTime() > Date.now()) {
      ctx.addIssue({ code: "custom", path: ["issuedAt"], message: "Emissão no futuro" });
    }
  });

type FormValues = z.infer<typeof schema>;

const isoDay = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

export function PrescriptionFormModal({
  patient: initialPatient,
  onClose,
  onSaved,
}: {
  patient?: PatientDTO | null;
  onClose: () => void;
  onSaved?: (p: PrescriptionDTO) => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const { needsUnit } = useUnit();
  const [patient, setPatient] = useState<PatientDTO | null>(initialPatient ?? null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver<FormValues>(schema),
    defaultValues: {
      prescriberName: "",
      prescriberCouncil: "CRM",
      prescriberCouncilNumber: "",
      number: "",
      issuedAt: isoDay(0),
      validUntil: isoDay(30),
      retained: false,
      notes: "",
    },
  });

  const mut = useMutation({
    mutationFn: (v: FormValues) =>
      prescriptionsApi.create({
        patientId: patient!.id,
        prescriberName: v.prescriberName.trim(),
        prescriberCouncil: v.prescriberCouncil,
        prescriberCouncilNumber: v.prescriberCouncilNumber.trim(),
        number: v.number.trim() || null,
        issuedAt: new Date(`${v.issuedAt}T12:00:00`).toISOString(),
        validUntil: new Date(`${v.validUntil}T23:59:59`).toISOString(),
        retained: v.retained,
        notes: v.notes.trim() || null,
      }),
    onSuccess: ({ prescription }) => {
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
      toast.success("Receita cadastrada");
      onSaved?.(prescription);
      onClose();
    },
    onError: (err) => setError(errMsg(err)),
  });

  const err = (k: keyof FormValues) =>
    errors[k]?.message ? <p className="text-xs text-accent-rose pl-1">{errors[k]!.message as string}</p> : null;

  return (
    <Modal title="Cadastrar receita" onClose={onClose} className="max-w-xl">
      <UnitRequiredNotice action="cadastrar receitas" />
      <form
        onSubmit={handleSubmit((v) => {
          setError(null);
          if (!patient) {
            setError("Selecione o paciente da receita");
            return;
          }
          mut.mutate(v);
        })}
        className="space-y-4"
      >
        <Field>
          <Label>Paciente</Label>
          <PatientPicker value={patient} onChange={setPatient} />
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field>
            <Label>Prescritor</Label>
            <Input {...register("prescriberName")} />
            {err("prescriberName")}
          </Field>
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <Field>
              <Label>Conselho</Label>
              <select
                {...register("prescriberCouncil")}
                className="h-10 w-full rounded-lg border border-line-strong bg-white px-2 text-sm outline-none focus:border-brand-500"
              >
                {COUNCILS.map((c) => (
                  <option key={c} value={c}>{COUNCIL_LABEL[c]}</option>
                ))}
              </select>
            </Field>
            <Field>
              <Label>Número</Label>
              <Input {...register("prescriberCouncilNumber")} />
              {err("prescriberCouncilNumber")}
            </Field>
          </div>
          <Field>
            <Label>Nº da receita (opcional)</Label>
            <Input {...register("number")} />
            {err("number")}
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field>
              <Label>Emissão</Label>
              <Input type="date" {...register("issuedAt")} />
              {err("issuedAt")}
            </Field>
            <Field>
              <Label>Válida até</Label>
              <Input type="date" {...register("validUntil")} />
              {err("validUntil")}
            </Field>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" {...register("retained")} className="size-4 accent-brand-500" />
          Receita retida na unidade
        </label>
        <Field>
          <Label>Observações</Label>
          <textarea
            rows={2}
            {...register("notes")}
            className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
          />
          {err("notes")}
        </Field>
        {error && (
          <p className="text-sm text-accent-rose bg-accent-rose/5 border border-accent-rose/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={mut.isPending || needsUnit}>
            {mut.isPending ? "Salvando..." : "Cadastrar receita"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
