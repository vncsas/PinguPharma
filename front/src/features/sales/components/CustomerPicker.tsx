import { Search, User, X } from "lucide-react";
import { useState } from "react";
import { Card } from "@/design-system/ui/GlassCard";
import { Input } from "@/design-system/ui/Input";
import type { CustomerDTO } from "@/features/customers/api";
import { useCustomers } from "@/features/customers/hooks";

interface CustomerPickerProps {
  customer: CustomerDTO | null;
  onChange: (customer: CustomerDTO | null) => void;
}

export function CustomerPicker({ customer, onChange }: CustomerPickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const customers = useCustomers(search, { enabled: open });

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-ink">Cliente</h2>
        <p className="text-xs text-ink-muted">Opcional. Fica em branco = Consumidor Final.</p>
      </div>

      {customer ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-50/60 border border-brand-100">
          <div className="grid size-9 place-items-center rounded-full bg-brand-500 text-white">
            <User className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{customer.name}</p>
            <p className="text-xs text-ink-muted">
              {customer.document ?? "sem CPF"} · {customer.phone ?? "sem telefone"}
            </p>
          </div>
          <button
            aria-label="Remover cliente"
            onClick={() => onChange(null)}
            className="grid size-7 place-items-center text-ink-muted hover:text-accent-rose"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <>
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar por nome ou CPF"
            leadingIcon={<Search className="size-4" />}
          />
          {open && (
            <div className="border border-line rounded-lg divide-y divide-line max-h-56 overflow-y-auto scrollbar-thin">
              {customers.isLoading && <p className="p-3 text-sm text-ink-muted">Buscando...</p>}
              {customers.data?.customers.length === 0 && (
                <p className="p-3 text-sm text-ink-muted">
                  Nenhum cliente cadastrado com esse termo.
                </p>
              )}
              {customers.data?.customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onChange(c);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="w-full text-left p-3 hover:bg-surface-alt transition-colors"
                >
                  <p className="text-sm font-medium text-ink">{c.name}</p>
                  <p className="text-xs text-ink-muted">
                    {c.document ?? "—"} · {c.phone ?? "—"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
