import { Barcode, Plus, Search } from "lucide-react";
import { Card } from "@/design-system/ui/GlassCard";
import { Input } from "@/design-system/ui/Input";
import type { ProductDTO } from "@/features/products/api";
import { useProducts } from "@/features/products/hooks";
import { brl } from "@/lib/utils";

interface ProductPickerProps {
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: (product: ProductDTO) => void;
  /** Com o carrinho cheio e a busca vazia não há por que listar produtos. */
  enabled: boolean;
}

export function ProductPicker({ search, onSearchChange, onAdd, enabled }: ProductPickerProps) {
  const products = useProducts({ search, active: true, pageSize: 8 }, { enabled });

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Buscar produto</h2>
          <p className="text-xs text-ink-muted">Escaneie o código de barras ou digite nome/SKU.</p>
        </div>
        <Barcode className="size-5 text-ink-muted" />
      </div>
      <Input
        autoFocus
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Ex: DIP-500 ou Dipirona"
        leadingIcon={<Search className="size-4" />}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {products.isLoading && (
          <p className="text-sm text-ink-muted col-span-full">Carregando...</p>
        )}
        {products.data?.data.length === 0 && (
          <p className="text-sm text-ink-muted col-span-full">Nenhum produto encontrado.</p>
        )}
        {products.data?.data.map((p) => {
          const low = p.totalStock <= p.minStockAlert;
          const noStock = p.totalStock <= 0;
          return (
            <button
              key={p.id}
              onClick={() => onAdd(p)}
              disabled={noStock}
              className={`text-left p-3 rounded-lg border transition-colors ${
                noStock
                  ? "border-line bg-surface-alt/60 opacity-60 cursor-not-allowed"
                  : "border-line hover:border-brand-500 hover:bg-brand-50/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-brand-50 text-brand-600 grid place-items-center">
                  <Plus className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                  <p className="text-xs text-ink-muted font-mono">{p.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{brl(p.price)}</p>
                  <p className={`text-[11px] ${low ? "text-accent-rose" : "text-ink-muted"}`}>
                    {noStock ? "Sem estoque" : `${p.totalStock} un.`}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
