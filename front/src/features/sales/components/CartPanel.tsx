import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { Button } from "@/design-system/ui/Button";
import { Card } from "@/design-system/ui/GlassCard";
import { brl } from "@/lib/utils";
import type { CartItem } from "../cart";

interface CartPanelProps {
  items: CartItem[];
  onChangeQty: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
}

export function CartPanel({ items, onChangeQty, onRemove, onClear }: CartPanelProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Carrinho</h2>
          <p className="text-xs text-ink-muted">
            {items.length === 0
              ? "Nenhum item adicionado ainda."
              : `${items.length} produto${items.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <Trash2 className="size-4" /> Limpar
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center text-ink-muted text-sm">
          <ShoppingBag className="size-8 mx-auto mb-2 opacity-50" />
          Adicione produtos da lista acima
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((c) => (
            <li key={c.product.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{c.product.name}</p>
                <p className="text-xs text-ink-muted">
                  {brl(c.product.price)} · SKU {c.product.sku}
                </p>
              </div>
              <div className="flex items-center gap-1 border border-line-strong rounded-lg overflow-hidden">
                <button
                  aria-label={`Diminuir ${c.product.name}`}
                  onClick={() => onChangeQty(c.product.id, -1)}
                  className="size-7 grid place-items-center hover:bg-surface-alt"
                >
                  <Minus className="size-3" />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{c.qty}</span>
                <button
                  aria-label={`Aumentar ${c.product.name}`}
                  onClick={() => onChangeQty(c.product.id, +1)}
                  disabled={c.qty >= c.product.totalStock}
                  className="size-7 grid place-items-center hover:bg-surface-alt disabled:opacity-40"
                >
                  <Plus className="size-3" />
                </button>
              </div>
              <div className="w-24 text-right font-semibold text-ink">
                {brl(c.qty * c.product.price)}
              </div>
              <button
                aria-label={`Remover ${c.product.name}`}
                onClick={() => onRemove(c.product.id)}
                className="grid size-7 place-items-center text-ink-muted hover:text-accent-rose"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
