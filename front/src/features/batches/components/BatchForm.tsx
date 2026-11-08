import { Package, PackagePlus, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/design-system/ui/Button";
import { FormError } from "@/design-system/ui/FormError";
import { Card } from "@/design-system/ui/GlassCard";
import { Field, Input, Label } from "@/design-system/ui/Input";
import type { ProductDTO } from "@/features/products/api";
import { useProducts } from "@/features/products/hooks";
import { serverError, useZodForm } from "@/lib/forms";
import { useCreateBatch } from "../hooks";
import { batchSchema } from "../schemas";

const EMPTY = { productId: "", lotNumber: "", quantity: 0, costPrice: 0, expiresAt: "" };

export function BatchForm() {
  const [productSearch, setProductSearch] = useState("");
  const [selected, setSelected] = useState<ProductDTO | null>(null);

  const products = useProducts(
    { search: productSearch, active: true, pageSize: 8 },
    { enabled: productSearch.length >= 1 },
  );
  const createBatch = useCreateBatch();
  const { register, handleSubmit, setValue, reset, setError, formState } = useZodForm(batchSchema, {
    defaultValues: EMPTY,
  });

  function selectProduct(product: ProductDTO | null) {
    setSelected(product);
    setValue("productId", product?.id ?? "", { shouldValidate: formState.isSubmitted });
  }

  const submit = handleSubmit(({ expiresAt, ...values }) =>
    createBatch.mutate(
      { ...values, expiresAt: new Date(expiresAt).toISOString() },
      {
        // Mantém o produto selecionado: o uso comum é registrar vários lotes do mesmo item.
        onSuccess: () => reset({ ...EMPTY, productId: selected?.id ?? "" }),
        onError: (err) => setError("root", serverError(err, "Erro ao registrar lote")),
      },
    ),
  );

  return (
    <Card className="space-y-5">
      <form onSubmit={submit} noValidate className="space-y-5">
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
                type="button"
                onClick={() => selectProduct(null)}
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
                error={formState.errors.productId?.message}
              />
              {productSearch && products.data && (
                <div className="border border-line rounded-lg divide-y divide-line max-h-56 overflow-y-auto scrollbar-thin">
                  {products.data.data.length === 0 && (
                    <p className="p-3 text-sm text-ink-muted">Nenhum produto encontrado.</p>
                  )}
                  {products.data.data.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => {
                        selectProduct(p);
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
              {...register("lotNumber")}
              className="uppercase"
              placeholder="Ex: L2026-1234"
              error={formState.errors.lotNumber?.message}
            />
          </Field>
          <Field>
            <Label>Quantidade</Label>
            <Input
              type="number"
              {...register("quantity", { valueAsNumber: true })}
              error={formState.errors.quantity?.message}
            />
          </Field>
          <Field>
            <Label>Preço de custo (R$)</Label>
            <Input
              type="number"
              step="0.01"
              {...register("costPrice", { valueAsNumber: true })}
              error={formState.errors.costPrice?.message}
            />
          </Field>
          <Field>
            <Label>Validade</Label>
            <Input
              type="date"
              {...register("expiresAt")}
              error={formState.errors.expiresAt?.message}
            />
          </Field>
        </div>

        <FormError message={formState.errors.root?.message} />

        <div className="flex justify-end">
          <Button type="submit" disabled={createBatch.isPending}>
            <PackagePlus className="size-4" />
            {createBatch.isPending ? "Registrando..." : "Registrar lote"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
