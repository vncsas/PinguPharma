import { useState } from "react";
import { Topbar } from "@/design-system/layout/Topbar";
import { Badge } from "@/design-system/ui/Badge";
import type { CustomerDTO } from "@/features/customers/api";
import { errorMessage } from "@/lib/api-client";
import { brl } from "@/lib/utils";
import { salesApi, type PaymentMethod } from "../api";
import { CartPanel } from "../components/CartPanel";
import { CheckoutPanel } from "../components/CheckoutPanel";
import { CustomerPicker } from "../components/CustomerPicker";
import { PaymentSelector } from "../components/PaymentSelector";
import { ProductPicker } from "../components/ProductPicker";
import { useCreateSale } from "../hooks";
import { useCart } from "../useCart";

export default function PdvPage() {
  const cart = useCart();
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState<CustomerDTO | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("PIX");
  const [error, setError] = useState<string | null>(null);
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const createSale = useCreateSale();

  function submitSale() {
    setError(null);
    setLastSaleId(null);
    createSale.mutate(
      {
        paymentMethod: payment,
        customerId: customer?.id ?? null,
        items: cart.items.map((c) => ({ productId: c.product.id, quantity: c.qty })),
      },
      {
        onSuccess: ({ sale }) => {
          // Limpa o carrinho antes do recibo: o botão volta a ficar habilitado assim que a
          // mutation termina, e o carrinho antigo não pode ser enviado duas vezes.
          setLastSaleId(sale.id);
          cart.clear();
          setCustomer(null);
          setSearch("");
          salesApi.openReceipt(sale.id).catch(() => {
            // A venda já foi registrada; falha ao abrir o recibo não deve bloquear o fluxo.
          });
        },
        onError: (err) => setError(errorMessage(err, "Erro ao registrar venda")),
      },
    );
  }

  const { units, amount } = cart.totals;

  return (
    <div className="space-y-6">
      <Topbar
        title="PDV"
        actions={
          <Badge tone="brand" dot>
            {units} item{units === 1 ? "" : "s"} · {brl(amount)}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
        <div className="space-y-4">
          <ProductPicker
            search={search}
            onSearchChange={setSearch}
            onAdd={cart.add}
            enabled={search.length >= 1 || cart.items.length === 0}
          />
          <CartPanel
            items={cart.items}
            onChangeQty={cart.updateQty}
            onRemove={cart.remove}
            onClear={cart.clear}
          />
        </div>

        <div className="space-y-4">
          <CustomerPicker customer={customer} onChange={setCustomer} />
          <PaymentSelector value={payment} onChange={setPayment} />
          <CheckoutPanel
            totals={cart.totals}
            error={error}
            lastSaleId={lastSaleId}
            submitting={createSale.isPending}
            onSubmit={submitSale}
            onDismissLastSale={() => setLastSaleId(null)}
          />
        </div>
      </div>
    </div>
  );
}
