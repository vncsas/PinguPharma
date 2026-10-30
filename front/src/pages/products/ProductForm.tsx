import { useEffect, useState } from "react";
import { errorMessage } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { productsApi, type ProductInput } from "@/features/products/api";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Field, Input, Label } from "@/design-system/components/Input";
import { ArrowLeft, BadgeCheck, Save, Trash2 } from "lucide-react";

const EMPTY: ProductInput = { name: "", sku: "", description: "", price: 0, minStockAlert: 0 };

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.get(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (data?.product) {
      const p = data.product;
      setForm({
        name: p.name,
        sku: p.sku,
        description: p.description ?? "",
        price: Number(p.price),
        minStockAlert: p.minStockAlert,
      });
      setActive(p.active);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) return productsApi.update(id!, { ...form, active });
      return productsApi.create(form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product", id] });
      nav("/produtos");
    },
    onError: (err) => setError(errorMessage(err, "Erro ao salvar")),
  });

  const delMutation = useMutation({
    mutationFn: () => productsApi.remove(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      nav("/produtos");
    },
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <Card className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-ink">Identificação</h2>
              <p className="text-xs text-ink-muted mt-0.5">Dados principais do produto.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field>
                <Label>Nome comercial</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  minLength={2}
                />
              </Field>
              <Field>
                <Label>SKU / Código</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))}
                  required
                />
              </Field>
            </div>

            <Field>
              <Label>Descrição</Label>
              <textarea
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
                placeholder="Composição, indicações, tarja, restrições..."
              />
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
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  required
                />
              </Field>
              <Field>
                <Label>Estoque mínimo (un.)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.minStockAlert}
                  onChange={(e) => setForm((f) => ({ ...f, minStockAlert: Number(e.target.value) }))}
                  required
                />
              </Field>
            </div>

            {isEdit && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="active"
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="size-4 accent-brand-500"
                />
                <label htmlFor="active" className="text-sm text-ink">
                  Produto ativo — aparece no PDV e em relatórios
                </label>
              </div>
            )}
          </Card>

          {error && (
            <div className="text-sm text-accent-rose bg-accent-rose/5 border border-accent-rose/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {isEdit && (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  if (confirm("Excluir produto? Ação irreversível se não houver movimentações.")) {
                    delMutation.mutate();
                  }
                }}
                disabled={delMutation.isPending}
              >
                <Trash2 className="size-4" /> Excluir
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/produtos">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              <Save className="size-4" />
              {mutation.isPending ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar"}
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

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 size-1.5 rounded-full bg-brand-500 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
