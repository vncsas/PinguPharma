import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Input } from "@/design-system/components/Input";
import { Badge } from "@/design-system/components/Badge";
import { Skeleton } from "@/design-system/components/Skeleton";
import { useToast } from "@/design-system/components/Toast";
import { UnitRequiredNotice } from "@/design-system/components/UnitRequiredNotice";
import { productsApi, isControlled, type ProductDTO } from "@/features/products/api";
import { PatientPicker } from "@/features/patients/PatientPicker";
import type { PatientDTO } from "@/features/patients/api";
import { PrescriptionFormModal } from "@/features/prescriptions/PrescriptionFormModal";
import { isPrescriptionValid, prescriptionsApi, type PrescriptionDTO } from "@/features/prescriptions/api";
import { dispensationsApi } from "@/features/dispensations/api";
import { useAuth } from "@/lib/auth-context";
import { useUnit } from "@/lib/unit-context";
import { STAFF_ROLES } from "@/lib/roles";
import { dayBR, errMsg } from "@/lib/utils";
import {
  Check,
  FilePlus2,
  Minus,
  Pill,
  Plus,
  Receipt,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";

interface CartItem {
  product: ProductDTO;
  qty: number;
}

export default function DispensationPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const { needsUnit } = useUnit();
  const isStaff = !!user && STAFF_ROLES.includes(user.role);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [patient, setPatient] = useState<PatientDTO | null>(null);
  const [prescription, setPrescription] = useState<PrescriptionDTO | null>(null);
  const [newPrescription, setNewPrescription] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastId, setLastId] = useState<string | null>(null);

  const products = useQuery({
    queryKey: ["dispensation-products", search],
    queryFn: () => productsApi.list({ search, active: true, pageSize: 8 }),
    enabled: !needsUnit,
  });

  const prescriptions = useQuery({
    queryKey: ["prescriptions", "patient", patient?.id],
    queryFn: () => prescriptionsApi.list({ patientId: patient!.id, validOnly: true, pageSize: 20 }),
    enabled: !!patient,
  });

  const hasControlled = cart.some((c) => isControlled(c.product.controlledClass));
  const totalUnits = cart.reduce((s, c) => s + c.qty, 0);

  const blocker = needsUnit
    ? "Selecione uma unidade no topo da página."
    : cart.length === 0
      ? "Adicione ao menos um produto."
      : hasControlled && !isStaff
        ? "Produto controlado exige farmacêutico ou gestor."
        : hasControlled && !patient
          ? "Produto controlado exige a identificação do paciente."
          : hasControlled && !prescription
            ? "Produto controlado exige receita válida do paciente."
            : null;

  const createMut = useMutation({
    mutationFn: () =>
      dispensationsApi.create({
        patientId: patient?.id ?? null,
        prescriptionId: prescription?.id ?? null,
        items: cart.map((c) => ({ productId: c.product.id, quantity: c.qty })),
      }),
    onSuccess: async ({ dispensation }) => {
      for (const key of ["products", "dispensation-products", "dashboard-metrics", "dispensations", "batches", "stock-movements"]) {
        qc.invalidateQueries({ queryKey: [key] });
      }
      toast.success("Dispensação registrada");
      try {
        await dispensationsApi.openReceipt(dispensation.id);
      } catch {
        toast.error("Não foi possível abrir o comprovante", "Reabra pelo botão abaixo.");
      }
      setLastId(dispensation.id);
      setCart([]);
      setPatient(null);
      setPrescription(null);
      setSearch("");
    },
    onError: (err) => setError(errMsg(err, "Erro ao registrar a dispensação")),
  });

  function addToCart(p: ProductDTO) {
    if (isControlled(p.controlledClass) && !isStaff) {
      toast.error("Produto controlado", "A dispensação exige farmacêutico ou gestor.");
      return;
    }
    setCart((prev) => {
      const found = prev.find((c) => c.product.id === p.id);
      if (found) {
        if (found.qty + 1 > p.totalStock) return prev;
        return prev.map((c) => (c.product.id === p.id ? { ...c, qty: c.qty + 1 } : c));
      }
      if (p.totalStock <= 0) return prev;
      return [...prev, { product: p, qty: 1 }];
    });
  }

  function setQty(id: string, qty: number) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.product.id !== id) return c;
          if (qty <= 0) return null;
          return { ...c, qty: Math.min(qty, c.product.totalStock) };
        })
        .filter(Boolean) as CartItem[],
    );
  }

  return (
    <div className="space-y-6">
      <Topbar
        title="Dispensação"
        actions={
          <Badge tone="brand" dot>
            {totalUnits} unidade{totalUnits === 1 ? "" : "s"} · {cart.length} produto{cart.length === 1 ? "" : "s"}
          </Badge>
        }
      />

      <UnitRequiredNotice action="registrar dispensações" />

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
        <div className="space-y-4">
          <Card className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-ink">Buscar produto</h2>
              <p className="text-xs text-ink-muted">Digite nome, código ou princípio ativo.</p>
            </div>
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ex: dipirona ou DIP-500"
              leadingIcon={<Search className="size-4" />}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {products.isLoading && !needsUnit && <Skeleton className="h-16 col-span-full" />}
              {products.isError && (
                <p className="text-sm text-accent-rose col-span-full">Não foi possível carregar os produtos.</p>
              )}
              {products.data?.data.length === 0 && (
                <p className="text-sm text-ink-muted col-span-full">Nenhum produto encontrado.</p>
              )}
              {products.data?.data.map((p) => {
                const noStock = p.totalStock <= 0;
                const low = p.totalStock <= p.minStockAlert;
                const controlled = isControlled(p.controlledClass);
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={noStock || needsUnit}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      noStock || needsUnit
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
                        <p className="text-xs text-ink-muted truncate">
                          {p.presentation ?? p.sku}
                        </p>
                      </div>
                      <div className="text-right space-y-0.5">
                        {controlled && <Badge tone="danger">Controlado {p.controlledClass}</Badge>}
                        <p className={`text-[11px] ${low ? "text-accent-rose" : "text-ink-muted"}`}>
                          {noStock ? "Sem estoque" : `${p.totalStock} ${p.measureUnit ?? "un."}`}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink">Itens a dispensar</h2>
                <p className="text-xs text-ink-muted">
                  A baixa é feita pelos lotes de validade mais próxima (FEFO).
                </p>
              </div>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setCart([])}>
                  <Trash2 className="size-4" /> Limpar
                </Button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-10 text-center text-ink-muted text-sm">
                <Pill className="size-8 mx-auto mb-2 opacity-50" />
                Adicione produtos da lista acima
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {cart.map((c) => (
                  <li key={c.product.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate">
                        {c.product.name}{" "}
                        {isControlled(c.product.controlledClass) && (
                          <Badge tone="danger">{c.product.controlledClass}</Badge>
                        )}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {c.product.presentation ?? c.product.sku} · disponível {c.product.totalStock}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 border border-line-strong rounded-lg overflow-hidden">
                      <button
                        aria-label="Diminuir"
                        onClick={() => setQty(c.product.id, c.qty - 1)}
                        className="size-7 grid place-items-center hover:bg-surface-alt"
                      >
                        <Minus className="size-3" />
                      </button>
                      <input
                        aria-label="Quantidade"
                        type="number"
                        min={1}
                        max={c.product.totalStock}
                        value={c.qty}
                        onChange={(e) => setQty(c.product.id, Number(e.target.value) || 1)}
                        className="w-12 text-center text-sm font-semibold outline-none"
                      />
                      <button
                        aria-label="Aumentar"
                        onClick={() => setQty(c.product.id, c.qty + 1)}
                        disabled={c.qty >= c.product.totalStock}
                        className="size-7 grid place-items-center hover:bg-surface-alt disabled:opacity-40"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <button
                      aria-label="Remover item"
                      onClick={() => setQty(c.product.id, 0)}
                      className="grid size-7 place-items-center text-ink-muted hover:text-accent-rose"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-ink">Paciente</h2>
              <p className="text-xs text-ink-muted">
                Busque por nome, CPF ou CNS. Obrigatório para produtos controlados.
              </p>
            </div>
            <PatientPicker
              value={patient}
              onChange={(p) => {
                setPatient(p);
                setPrescription(null);
              }}
            />
          </Card>

          <Card className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-ink">Receita</h2>
                <p className="text-xs text-ink-muted">
                  {hasControlled
                    ? "Obrigatória: há produto controlado na lista."
                    : "Opcional para produtos não controlados."}
                </p>
              </div>
              {isStaff && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!patient || needsUnit}
                  onClick={() => setNewPrescription(true)}
                >
                  <FilePlus2 className="size-4" /> Cadastrar
                </Button>
              )}
            </div>

            {!patient ? (
              <p className="text-sm text-ink-muted">Selecione o paciente para ver as receitas válidas.</p>
            ) : prescriptions.isLoading ? (
              <Skeleton className="h-12" />
            ) : prescriptions.isError ? (
              <p className="text-sm text-accent-rose">Não foi possível carregar as receitas.</p>
            ) : (prescriptions.data?.data.length ?? 0) === 0 ? (
              <p className="text-sm text-ink-muted">
                Este paciente não tem receita válida.
                {!isStaff && " Peça ao farmacêutico para cadastrar."}
              </p>
            ) : (
              <ul className="space-y-2">
                {prescriptions.data!.data.filter(isPrescriptionValid).map((r) => {
                  const active = prescription?.id === r.id;
                  return (
                    <li key={r.id}>
                      <button
                        onClick={() => setPrescription(active ? null : r)}
                        className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                          active ? "border-brand-500 bg-brand-50/60" : "border-line hover:bg-surface-alt"
                        }`}
                      >
                        <p className="font-medium text-ink">
                          {r.number ? `Receita ${r.number}` : "Receita"} · {r.prescriberName}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {r.prescriberCouncil} {r.prescriberCouncilNumber} · emitida {dayBR(r.issuedAt)} · válida até {dayBR(r.validUntil)}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="space-y-4">
            {hasControlled && !isStaff && (
              <div className="flex gap-2 text-sm text-accent-rose bg-accent-rose/5 border border-accent-rose/20 rounded-lg px-3 py-2">
                <ShieldAlert className="size-4 mt-0.5 shrink-0" />
                Produto controlado: a dispensação deve ser feita por farmacêutico ou gestor.
              </div>
            )}
            {error && (
              <div className="text-sm text-accent-rose bg-accent-rose/5 border border-accent-rose/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {lastId && (
              <div className="text-sm bg-accent-success/5 border border-accent-success/20 rounded-lg px-3 py-2 space-y-2">
                <p className="text-accent-success font-medium flex items-center gap-1.5">
                  <Check className="size-4" /> Dispensação #{lastId.slice(-8).toUpperCase()} registrada
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => dispensationsApi.openReceipt(lastId).catch((e) => toast.error("Comprovante", errMsg(e)))}
                  >
                    <Receipt className="size-3.5" /> Reabrir comprovante
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setLastId(null)}>OK</Button>
                </div>
              </div>
            )}

            <Button
              size="lg"
              className="w-full"
              disabled={!!blocker || createMut.isPending}
              onClick={() => {
                setError(null);
                setLastId(null);
                createMut.mutate();
              }}
            >
              <Check className="size-4" />
              {createMut.isPending ? "Registrando..." : "Registrar dispensação"}
            </Button>
            {blocker && cart.length > 0 && (
              <p className="text-xs text-ink-muted text-center">{blocker}</p>
            )}
            <p className="text-xs text-ink-muted text-center flex items-center justify-center gap-1">
              <Receipt className="size-3" /> O comprovante abre em nova aba ao registrar.
            </p>
          </Card>
        </div>
      </div>

      {newPrescription && patient && (
        <PrescriptionFormModal
          patient={patient}
          onClose={() => setNewPrescription(false)}
          onSaved={(r) => setPrescription(r)}
        />
      )}
    </div>
  );
}
