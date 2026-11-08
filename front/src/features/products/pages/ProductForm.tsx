import { useEffect } from "react";
import { serverError, useZodForm } from "@/lib/forms";
import { productSchema } from "../schemas";
import { FormError } from "@/design-system/ui/FormError";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useCreateProduct,
  useDeleteProduct,
  useProduct,
  useUpdateProduct,
} from "@/features/products/hooks";
import { Topbar } from "@/design-system/layout/Topbar";
import { Card } from "@/design-system/ui/GlassCard";
import { Bullet } from "@/design-system/ui/Bullet";
import { Button } from "@/design-system/ui/Button";
import { useConfirm } from "@/design-system/ui/ConfirmDialog";
import { Field, Input, Label } from "@/design-system/ui/Input";
import { ArrowLeft, BadgeCheck, Save, Trash2 } from "lucide-react";

const EMPTY = {
  name: "",
  sku: "",
  description: "",
  price: 0,
  minStockAlert: 0,
  active: true,
};

export default function ProductForm() {
  const confirm = useConfirm();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();
  const { data } = useProduct(id);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const saving = createProduct.isPending || updateProduct.isPending;
  const { register, handleSubmit, reset, setError, formState } = useZodForm(productSchema, {
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!data?.product) return;
    const p = data.product;
    reset({
      name: p.name,
      sku: p.sku,
      description: p.description ?? "",
      price: Number(p.price),
      minStockAlert: p.minStockAlert,
      active: p.active,
    });
  }, [data, reset]);

  const submit = handleSubmit(({ active, ...input }) => {
    const callbacks = {
      onSuccess: () => nav("/produtos"),
      onError: (err: unknown) => setError("root", serverError(err, "Erro ao salvar")),
    };
    if (id) updateProduct.mutate({ id, data: { ...input, active } }, callbacks);
    else createProduct.mutate(input, callbacks);
  });

  return (
    <div className="space-y-6">
      <Topbar
        title={isEdit ? "Editar produto" : "Novo produto"}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to="/produtos">
              <ArrowLeft className="size-4" /> Voltar
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
        <form onSubmit={submit} noValidate className="space-y-4">
          <Card className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-ink">Identificação</h2>
              <p className="text-xs text-ink-muted mt-0.5">Dados principais do produto.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field>
                <Label>Nome comercial</Label>
                <Input {...register("name")} error={formState.errors.name?.message} />
              </Field>
              <Field>
                <Label>SKU / Código</Label>
                <Input
                  {...register("sku")}
                  className="uppercase"
                  error={formState.errors.sku?.message}
                />
              </Field>
            </div>

            <Field>
              <Label>Descrição</Label>
              <textarea
                {...register("description")}
                rows={4}
                className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
                placeholder="Composição, indicações, tarja, restrições..."
              />
              {formState.errors.description && (
                <p className="text-xs text-accent-rose pl-1">{formState.errors.description.message}</p>
              )}
            </Field>
          </Card>

          <Card className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-ink">Preço & Estoque</h2>
              <p className="text-xs text-ink-muted mt-0.5">Preço unitário e mínimo para alertas.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field>
                <Label>Preço de venda (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("price", { valueAsNumber: true })}
                  error={formState.errors.price?.message}
                />
              </Field>
              <Field>
                <Label>Estoque mínimo (un.)</Label>
                <Input
                  type="number"
                  {...register("minStockAlert", { valueAsNumber: true })}
                  error={formState.errors.minStockAlert?.message}
                />
              </Field>
            </div>

            {isEdit && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="active"
                  type="checkbox"
                  {...register("active")}
                  className="size-4 accent-brand-500"
                />
                <label htmlFor="active" className="text-sm text-ink">
                  Produto ativo — aparece no PDV e em relatórios
                </label>
              </div>
            )}
          </Card>

          <FormError message={formState.errors.root?.message} />

          <div className="flex flex-wrap items-center justify-end gap-2">
            {isEdit && (
              <Button
                type="button"
                variant="danger"
                onClick={async () => {
                  const ok = await confirm({
                    title: "Excluir produto?",
                    description: "Ação irreversível se não houver movimentações.",
                    confirmLabel: "Excluir",
                    danger: true,
                  });
                  if (ok) deleteProduct.mutate(id!, { onSuccess: () => nav("/produtos") });
                }}
                disabled={deleteProduct.isPending}
              >
                <Trash2 className="size-4" /> Excluir
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/produtos">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="size-4" />
              {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar"}
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          <Card className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
                <BadgeCheck className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Boas práticas</p>
                <p className="text-xs text-ink-muted">Segurança do paciente em primeiro lugar</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-ink-muted">
              <Bullet>SKU único garante integridade e conciliação fiscal.</Bullet>
              <Bullet>Estoque mínimo dispara alerta no dashboard.</Bullet>
              <Bullet>Preço serve de base para PDV e relatório de margem.</Bullet>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
