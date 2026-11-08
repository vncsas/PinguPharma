import { Button } from "@/design-system/ui/Button";
import { Badge } from "@/design-system/ui/Badge";
import { Dialog } from "@/design-system/ui/Dialog";
import { useConfirm } from "@/design-system/ui/ConfirmDialog";
import { Skeleton } from "@/design-system/ui/Skeleton";
import { salesApi, type SaleDetailDTO } from "@/features/sales/api";
import { paymentLabel } from "@/features/sales/constants";
import { brl, dateBR } from "@/lib/utils";
import { Ban, Receipt } from "lucide-react";

export function SaleDetailModal({
  onClose,
  loading,
  detail,
  onCancel,
  canceling,
}: {
  onClose: () => void;
  loading: boolean;
  detail?: SaleDetailDTO;
  onCancel: () => void;
  canceling: boolean;
}) {
  const confirm = useConfirm();
  return (
    <Dialog
      title="Detalhes da venda"
      description={detail ? `#${String(detail.id).slice(-8).toUpperCase()}` : "Carregando..."}
      onClose={onClose}
      className="max-w-2xl"
    >
      <div className="space-y-5">
        {loading || !detail ? (
          <Skeleton className="h-40" />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <Field label="Data" value={dateBR(detail.createdAt)} />
              <Field label="Vendedor" value={detail.userName} />
              <Field label="Cliente" value={detail.customerName ?? detail.clientName} />
              <Field label="Pagamento" value={paymentLabel(detail.paymentMethod)} />
              <Field label="Itens" value={String(detail.items.length)} />
              <Field
                label="Status"
                value={
                  <Badge tone={detail.status === "COMPLETED" ? "success" : "danger"} dot>
                    {detail.status === "COMPLETED" ? "Concluída" : "Cancelada"}
                  </Badge>
                }
              />
            </div>

            <div>
              <p className="text-xs font-medium text-ink-muted mb-2">Itens</p>
              <div className="border border-line rounded-lg divide-y divide-line">
                {detail.items.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{i.productName}</p>
                      <p className="text-xs text-ink-muted">
                        SKU {i.productSku}
                        {i.lotNumber && (
                          <>
                            {" "}
                            · Lote <span className="font-mono">{i.lotNumber}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {i.quantity}x {brl(i.unitPrice)}
                      </p>
                      <p className="text-xs font-semibold">{brl(i.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-alt">
              <span className="text-sm text-ink-muted">Total</span>
              <span className="text-2xl font-semibold">{brl(detail.totalAmount)}</span>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => salesApi.openReceipt(detail.id)}>
                <Receipt className="size-4" /> Abrir cupom
              </Button>
              {detail.status === "COMPLETED" && (
                <Button
                  variant="danger"
                  disabled={canceling}
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Cancelar venda?",
                      description: "O estoque será estornado por lote.",
                      confirmLabel: "Cancelar venda",
                      danger: true,
                    });
                    if (ok) onCancel();
                  }}
                >
                  <Ban className="size-4" />
                  {canceling ? "Cancelando..." : "Cancelar venda"}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}

export function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">{label}</p>
      <div className="text-sm text-ink mt-0.5">{value}</div>
    </div>
  );
}
