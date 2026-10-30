import { Package, PackagePlus, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/design-system/ui/Button";
import { Card } from "@/design-system/ui/GlassCard";
import { Field, Input, Label } from "@/design-system/ui/Input";
import type { ProductDTO } from "@/features/products/api";
import { useProducts } from "@/features/products/hooks";
import { errorMessage } from "@/lib/api-client";
import { useCreateBatch } from "../hooks";

export function BatchForm() {
  const [productSearch, setProductSearch] = useState("");
  const [selected, setSelected] = useState<ProductDTO | null>(null);
  const [lot, setLot] = useState("");
  const [qty, setQty] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [exp, setExp] = useState("");
  const [error, setError] = useState<string | null>(null);

  const products = useProducts(
    { search: productSearch, active: true, pageSize: 8 },
    { enabled: productSearch.length >= 1 },
  );
  const createBatch = useCreateBatch();

  function submit() {
    if (!selected) return;
    setError(null);
    createBatch.mutate(
      {
        productId: selected.id,
        lotNumber: lot,
        quantity: qty,
        costPrice: cost,
        expiresAt: new Date(exp).toISOString(),
      },
      {
        onSuccess: () => {
          setLot("");
          setQty(0);
          setCost(0);
          setExp("");
        },
        onError: (err) => setError(errorMessage(err, "Erro ao registrar lote")),
      },
    );
  }

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-ink">Registrar novo lote</h2>
        <p className="text-xs text-ink-muted">
          Selecione o produto, informe lote/quantidade/custo/validade.
        </p>
      </div>

      <Field>
        <Label>Produto</Label>
        {selected ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-50/60 border border-brand-100">
            <div className="grid size-9 place-items-center rounded-lg bg-brand-500 text-white">
              <Package className="size-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{selected.name}</p>
              <p className="text-xs text-ink-muted">
                SKU {selected.sku} · estoque atual {selected.totalStock}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-ink-muted hover:text-ink"
            >
              Trocar
            </button>
          </div>
        ) : (
          <>
            <Input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Buscar por nome ou SKU"
              leadingIcon={<Search className="size-4" />}
            />
            {productSearch && products.data && (
              <div className="border border-line rounded-lg divide-y divide-line max-h-56 overflow-y-auto scrollbar-thin">
                {products.data.data.length === 0 && (
                  <p className="p-3 text-sm text-ink-muted">Nenhum produto encontrado.</p>
                )}
                {products.data.data.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelected(p);
                      setProductSearch("");
                    }}
                    className="w-full text-left p-3 hover:bg-surface-alt transition-colors"
                  >
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-ink-muted">
                      SKU {p.sku} · estoque {p.totalStock}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </Field>

      <div className="grid md:grid-cols-2 gap-4">
        <Field>
          <Label>Número do lote</Label>
          <Input
            value={lot}
            onChange={(e) => setLot(e.target.value.toUpperCase())}
            placeholder="Ex: L2026-1234"
          />
        </Field>
        <Field>
          <Label>Quantidade</Label>
          <Input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </Field>
        <Field>
          <Label>Preço de custo (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
          />
        </Field>
        <Field>
          <Label>Validade</Label>
          <Input type="date" value={exp} onChange={(e) => setExp(e.target.value)} />
        </Field>
      </div>

      {error && (
        <div className="text-sm text-accent-rose bg-accent-rose/5 border border-accent-rose/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={submit}
          disabled={createBatch.isPending || !selected || !lot || qty <= 0 || cost < 0 || !exp}
        >
          <PackagePlus className="size-4" />
          {createBatch.isPending ? "Registrando..." : "Registrar lote"}
        </Button>
      </div>
    </Card>
  );
}
