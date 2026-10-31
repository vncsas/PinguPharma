import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User, UserPlus, X } from "lucide-react";
import { Input } from "@/design-system/components/Input";
import { Button } from "@/design-system/components/Button";
import { patientsApi, type PatientDTO } from "./api";
import { PatientFormModal } from "./PatientFormModal";

export function PatientPicker({
  value,
  onChange,
  allowCreate = true,
  autoFocus,
}: {
  value: PatientDTO | null;
  onChange: (p: PatientDTO | null) => void;
  allowCreate?: boolean;
  autoFocus?: boolean;
}) {
  const [term, setTerm] = useState("");
  const [creating, setCreating] = useState(false);
  const enabled = term.trim().length >= 2;

  const results = useQuery({
    queryKey: ["patients", "picker", term],
    queryFn: () => patientsApi.list({ search: term.trim(), active: true, pageSize: 6 }),
    enabled,
  });

  if (value) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-50/60 border border-brand-100">
        <div className="grid size-9 place-items-center rounded-full bg-brand-500 text-white">
          <User className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate">{value.name}</p>
          <p className="text-xs text-ink-muted">
            CPF {value.cpf ?? "—"} · CNS {value.cns ?? "—"}
          </p>
        </div>
        <button
          type="button"
          aria-label="Remover paciente"
          onClick={() => onChange(null)}
          className="grid size-7 place-items-center text-ink-muted hover:text-accent-rose"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        autoFocus={autoFocus}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Buscar por nome, CPF ou CNS"
        leadingIcon={<Search className="size-4" />}
      />
      {enabled && (
        <div className="border border-line rounded-lg divide-y divide-line max-h-56 overflow-y-auto scrollbar-thin">
          {results.isLoading && <p className="p-3 text-sm text-ink-muted">Buscando...</p>}
          {results.isError && <p className="p-3 text-sm text-accent-rose">Falha ao buscar pacientes.</p>}
          {results.data?.data.length === 0 && (
            <p className="p-3 text-sm text-ink-muted">Nenhum paciente encontrado.</p>
          )}
          {results.data?.data.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => {
                onChange(p);
                setTerm("");
              }}
              className="w-full text-left p-3 hover:bg-surface-alt transition-colors"
            >
              <p className="text-sm font-medium text-ink">{p.name}</p>
              <p className="text-xs text-ink-muted">
                CPF {p.cpf ?? "—"} · CNS {p.cns ?? "—"}
              </p>
            </button>
          ))}
        </div>
      )}
      {allowCreate && (
        <Button type="button" variant="outline" size="sm" onClick={() => setCreating(true)}>
          <UserPlus className="size-4" /> Cadastro rápido de paciente
        </Button>
      )}
      {creating && (
        <PatientFormModal onClose={() => setCreating(false)} onSaved={(p) => onChange(p)} />
      )}
    </div>
  );
}
