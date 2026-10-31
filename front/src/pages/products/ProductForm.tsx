import { useConfirm } from "@/design-system/components/ConfirmDialog";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CONTROLLED_CLASSES,
  isControlled,
  productsApi,
  type ProductInput,
} from "@/features/products/api";
import { Badge } from "@/design-system/components/Badge";
import { useToast } from "@/design-system/components/Toast";
import { errMsg } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Field, Input, Label } from "@/design-system/components/Input";
import { ArrowLeft, BadgeCheck, Save, Trash2 } from "lucide-react";

const EMPTY: ProductInput = {
  name: "",
  sku: "",
  description: "",
  price: 0,
  minStockAlert: 0,
  controlledClass: "NONE",
  activeIngredient: "",
  presentation: "",
  measureUnit: "",
  manufacturer: "",
  renameCode: "",
};

const CLASS_LABEL = (c: string) => (c === "NONE" ? "Não controlado" : `Classe ${c}`);

export default function ProductForm() {
  const confirm = useConfirm();
  const toast = useToast();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

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
        controlledClass: p.controlledClass,
        activeIngredient: p.activeIngredient ?? "",
        presentation: p.presentation ?? "",
        measureUnit: p.measureUnit ?? "",
        manufacturer: p.manufacturer ?? "",
        renameCode: p.renameCode ?? "",
      });
      setActive(p.active);
    }
  }, [data]);

  const lockedControlled = !isAdmin && data?.product != null && data.product.controlledClass !== "NONE";

  const mutation = useMutation({
    mutationFn: async () => {
      const clean = (v?: string | null) => (v && v.trim() ? v.trim() : null);
      const payload: ProductInput = {
        ...form,
        activeIngredient: clean(form.activeIngredient),
        presentation: clean(form.presentation),
        measureUnit: clean(form.measureUnit),
        manufacturer: clean(form.manufacturer),
        renameCode: clean(form.renameCode),
      };
      if (isEdit) return productsApi.update(id!, { ...payload, active });
      return productsApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product", id] });
      toast.success(isEdit ? "Produto atualizado" : "Produto cadastrado");
      nav("/produtos");
    },
    onError: (err) => setError(errMsg(err, "Erro ao salvar")),
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
                <Label>Código interno</Label>
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
                placeholder="Composição, indicações, restrições..."
              />
            </Field>
          </Card>

          <Card className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-ink">Dados farmacêuticos</h2>
              <p className="text-xs text-ink-muted mt-0.5">Classificação e identificação do medicamento.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field>
                <Label>Classe de controle especial</Label>
                <select
                  value={form.controlledClass}
                  disabled={!isAdmin && isEdit}
                  onChange={(e) => setForm((f) => ({ ...f, controlledClass: e.target.value as ProductInput["controlledClass"] }))}
                  className="h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm outline-none focus:border-brand-500"
                >
                  {CONTROLLED_CLASSES.map((c) => (
                    <option key={c} value={c}>{CLASS_LABEL(c)}</option>
                  ))}
                </select>
                {!isAdmin && isEdit && (
                  <p className="text-xs text-ink-muted">Somente o administrador pode alterar a classe de controle especial.</p>
                )}
                {isControlled(form.controlledClass) && (
                  <Badge tone="danger">Exige receita e farmacêutico na dispensação</Badge>
                )}
              </Field>
              <Field>
                <Label>Princípio ativo</Label>
                <Input
                  value={form.activeIngredient ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, activeIngredient: e.target.value }))}
                />
              </Field>
              <Field>
                <Label>Apresentação</Label>
                <Input
                  value={form.presentation ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, presentation: e.target.value }))}
                  placeholder="Ex: Comprimido 500 mg"
                />
              </Field>
              <Field>
                <Label>Unidade de medida</Label>
                <Input
                  value={form.measureUnit ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, measureUnit: e.target.value }))}
                  placeholder="Ex: comprimido, frasco, ampola"
                />
              </Field>
              <Field>
                <Label>Fabricante</Label>
                <Input
                  value={form.manufacturer ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
                />
              </Field>
              <Field>
                <Label>Código RENAME</Label>
                <Input
                  value={form.renameCode ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, renameCode: e.target.value }))}
                />
              </Field>
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-ink">Valor & Estoque</h2>
              <p className="text-xs text-ink-muted mt-0.5">Valor de referência e mínimo para alertas.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field>
                <Label>Valor de referência (R$)</Label>
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
                  Produto ativo — disponível para dispensação e nos relatórios
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
                onClick={async () => {
                  if (
                    await confirm({
                      title: "Excluir produto?",
                      description: "Ação irreversível se não houver movimentações.",
                      confirmLabel: "Excluir",
                      tone: "danger",
                    })
                  ) {
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
            <Button type="submit" disabled={mutation.isPending || lockedControlled}>
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
              <Bullet>O código interno deve ser único para conciliar o estoque.</Bullet>
              <Bullet>Estoque mínimo dispara alerta no dashboard.</Bullet>
              <Bullet>O valor de referência serve apenas para prestação de contas; não há cobrança ao paciente.</Bullet>
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
