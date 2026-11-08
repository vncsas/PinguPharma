import { Check, Receipt } from "lucide-react";
import { Button } from "@/design-system/ui/Button";
import { Card } from "@/design-system/ui/GlassCard";
import { brl } from "@/lib/utils";
import { salesApi } from "../api";
import type { cartTotals } from "../cart";

interface CheckoutPanelProps {
  totals: ReturnType<typeof cartTotals>;
  error: string | null;
  lastSaleId: string | null;
  submitting: boolean;
  onSubmit: () => void;
  onDismissLastSale: () => void;
}

export function CheckoutPanel({
  totals,
  error,
  lastSaleId,
  submitting,
  onSubmit,
  onDismissLastSale,
}: CheckoutPanelProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-ink-muted">Total</span>
        <span className="text-3xl font-semibold text-ink">{brl(totals.amount)}</span>
      </div>
      <div className="flex justify-between text-xs text-ink-muted">
        <span>
          {totals.units} unidade{totals.units === 1 ? "" : "s"}
        </span>
        <span>
          {totals.products} produto{totals.products === 1 ? "" : "s"}
        </span>
      </div>

      {error && (
        <div className="text-sm text-accent-rose bg-accent-rose/5 border border-accent-rose/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {lastSaleId && (
        <div className="text-sm bg-accent-success/5 border border-accent-success/20 rounded-lg px-3 py-2 space-y-2">
          <p className="text-accent-success font-medium flex items-center gap-1.5">
            <Check className="size-4" /> Venda #{lastSaleId.slice(-8).toUpperCase()} registrada
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => salesApi.openReceipt(lastSaleId)}
            >
              <Receipt className="size-3.5" /> Reabrir cupom
            </Button>
            <Button size="sm" variant="ghost" onClick={onDismissLastSale}>
              OK
            </Button>
          </div>
        </div>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={totals.products === 0 || submitting}
        onClick={onSubmit}
      >
        <Check className="size-4" />
        {submitting ? "Registrando..." : "Finalizar venda"}
      </Button>
      <p className="text-xs text-ink-muted text-center flex items-center justify-center gap-1">
        <Receipt className="size-3" /> Cupom abre em nova aba · caixa fica aqui pra próxima venda
      </p>
    </Card>
  );
}
