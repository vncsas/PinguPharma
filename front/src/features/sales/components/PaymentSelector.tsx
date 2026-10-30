import { Card } from "@/design-system/ui/GlassCard";
import type { PaymentMethod } from "../api";
import { PAYMENT_METHODS } from "../constants";

interface PaymentSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export function PaymentSelector({ value, onChange }: PaymentSelectorProps) {
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-ink">Forma de pagamento</h2>
        <p className="text-xs text-ink-muted">Selecione como o cliente pagou.</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PAYMENT_METHODS.map((p) => (
          <button
            key={p.key}
            onClick={() => onChange(p.key)}
            aria-pressed={value === p.key}
            className={`h-10 rounded-lg text-sm font-medium border transition-colors ${
              value === p.key
                ? "bg-brand-500 text-white border-brand-500"
                : "bg-white text-ink border-line-strong hover:bg-surface-alt"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
