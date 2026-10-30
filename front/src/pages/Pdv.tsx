import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Input } from "@/design-system/components/Input";
import { Badge } from "@/design-system/components/Badge";
import { productsApi, type ProductDTO } from "@/features/products/api";
import { customersApi, type CustomerDTO } from "@/features/customers/api";
import { salesApi, type PaymentMethod } from "@/features/sales/api";
import { brl } from "@/lib/utils";
import {
  Barcode,
  Check,
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  Trash2,
  User,
  X,
} from "lucide-react";

interface CartItem {
  product: ProductDTO;
  qty: number;
}

const PAYMENTS: { key: PaymentMethod; label: string }[] = [
  { key: "PIX", label: "PIX" },
  { key: "CREDIT", label: "Crédito" },
  { key: "DEBIT", label: "Débito" },
  { key: "CASH", label: "Dinheiro" },
  { key: "OTHER", label: "Outro" },
];

export default function PdvPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customer, setCustomer] = useState<CustomerDTO | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("PIX");
  const [error, setError] = useState<string | null>(null);
  const [showCustomerBox, setShowCustomerBox] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);

  const products = useQuery({
    queryKey: ["pdv-products", search],
    queryFn: () => productsApi.list({ search, active: true, pageSize: 8 }),
    enabled: search.length >= 1 || cart.length === 0,
  });

  const customers = useQuery({
    queryKey: ["customers", customerSearch],
    queryFn: () => customersApi.list(customerSearch),
    enabled: showCustomerBox,
  });

  const total = useMemo(
    () => cart.reduce((s, c) => s + c.qty * c.product.price, 0),
    [cart],
  );
  const totalItems = cart.reduce((s, c) => s + c.qty, 0);

  const createMut = useMutation({
    mutationFn: () =>
      salesApi.create({
        paymentMethod: payment,
        customerId: customer?.id ?? null,
        items: cart.map((c) => ({ productId: c.product.id, quantity: c.qty })),
      }),
    onSuccess: async ({ sale }) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["pdv-products"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      try {
        await salesApi.openReceipt(sale.id);
      } catch {
        // A venda já foi registrada; falha ao abrir o recibo não deve bloquear o fluxo.
      }
      setLastSaleId(sale.id);
      setCart([]);
      setCustomer(null);
      setSearch("");
    },
    onError: (err: any) => setError(err.message ?? "Erro ao registrar venda"),
  });

  function addToCart(p: ProductDTO) {
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

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.product.id !== id) return c;
          const next = c.qty + delta;
          if (next <= 0) return null;
          if (next > c.product.totalStock) return c;
          return { ...c, qty: next };
        })
        .filter(Boolean) as CartItem[],
    );
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((c) => c.product.id !== id));
  }

  return (
    <div className="space-y-6">
      <Topbar
        title="PDV"
        actions={
          <Badge tone="brand" dot>
            {totalItems} item{totalItems === 1 ? "" : "s"} · {brl(total)}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
        <div className="space-y-4">
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
              onChange={(e) => setSearch(e.target.value)}
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
                    onClick={() => addToCart(p)}
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

          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink">Carrinho</h2>
                <p className="text-xs text-ink-muted">
                  {cart.length === 0
                    ? "Nenhum item adicionado ainda."
                    : `${cart.length} produto${cart.length === 1 ? "" : "s"}`}
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
                <ShoppingBag className="size-8 mx-auto mb-2 opacity-50" />
                Adicione produtos da lista acima
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {cart.map((c) => (
                  <li key={c.product.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate">{c.product.name}</p>
                      <p className="text-xs text-ink-muted">
                        {brl(c.product.price)} · SKU {c.product.sku}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 border border-line-strong rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQty(c.product.id, -1)}
                        className="size-7 grid place-items-center hover:bg-surface-alt"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{c.qty}</span>
                      <button
                        onClick={() => updateQty(c.product.id, +1)}
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
                      onClick={() => removeItem(c.product.id)}
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
              <h2 className="text-base font-semibold text-ink">Cliente</h2>
              <p className="text-xs text-ink-muted">Opcional. Fica em branco = Consumidor Final.</p>
            </div>

            {customer ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-50/60 border border-brand-100">
                <div className="grid size-9 place-items-center rounded-full bg-brand-500 text-white">
                  <User className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{customer.name}</p>
                  <p className="text-xs text-ink-muted">
                    {customer.document ?? "sem CPF"} · {customer.phone ?? "sem telefone"}
                  </p>
                </div>
                <button
                  onClick={() => setCustomer(null)}
                  className="grid size-7 place-items-center text-ink-muted hover:text-accent-rose"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <>
                <Input
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerBox(true);
                  }}
                  onFocus={() => setShowCustomerBox(true)}
                  placeholder="Buscar por nome ou CPF"
                  leadingIcon={<Search className="size-4" />}
                />
                {showCustomerBox && (
                  <div className="border border-line rounded-lg divide-y divide-line max-h-56 overflow-y-auto scrollbar-thin">
                    {customers.isLoading && (
                      <p className="p-3 text-sm text-ink-muted">Buscando...</p>
                    )}
                    {customers.data?.customers.length === 0 && (
                      <p className="p-3 text-sm text-ink-muted">
                        Nenhum cliente cadastrado com esse termo.
                      </p>
                    )}
                    {customers.data?.customers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCustomer(c);
                          setShowCustomerBox(false);
                          setCustomerSearch("");
                        }}
                        className="w-full text-left p-3 hover:bg-surface-alt transition-colors"
                      >
                        <p className="text-sm font-medium text-ink">{c.name}</p>
                        <p className="text-xs text-ink-muted">
                          {c.document ?? "—"} · {c.phone ?? "—"}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>

          <Card className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-ink">Forma de pagamento</h2>
              <p className="text-xs text-ink-muted">Selecione como o cliente pagou.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENTS.map((p) => {
                const active = payment === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => setPayment(p.key)}
                    className={`h-10 rounded-lg text-sm font-medium border transition-colors ${
                      active
                        ? "bg-brand-500 text-white border-brand-500"
                        : "bg-white text-ink border-line-strong hover:bg-surface-alt"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink-muted">Total</span>
              <span className="text-3xl font-semibold text-ink">{brl(total)}</span>
            </div>
            <div className="flex justify-between text-xs text-ink-muted">
              <span>{totalItems} unidade{totalItems === 1 ? "" : "s"}</span>
              <span>{cart.length} produto{cart.length === 1 ? "" : "s"}</span>
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
                  <Button size="sm" variant="ghost" onClick={() => setLastSaleId(null)}>
                    OK
                  </Button>
                </div>
              </div>
            )}

            <Button
              size="lg"
              className="w-full"
              disabled={cart.length === 0 || createMut.isPending}
              onClick={() => {
                setError(null);
                setLastSaleId(null);
                createMut.mutate();
              }}
            >
              <Check className="size-4" />
              {createMut.isPending ? "Registrando..." : "Finalizar venda"}
            </Button>
            <p className="text-xs text-ink-muted text-center flex items-center justify-center gap-1">
              <Receipt className="size-3" /> Cupom abre em nova aba · caixa fica aqui pra próxima venda
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
