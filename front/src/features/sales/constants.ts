import type { PaymentMethod, SaleStatus } from "./api";

export const PAYMENT_METHODS: { key: PaymentMethod; label: string }[] = [
  { key: "PIX", label: "PIX" },
  { key: "CREDIT", label: "Crédito" },
  { key: "DEBIT", label: "Débito" },
  { key: "CASH", label: "Dinheiro" },
  { key: "OTHER", label: "Outro" },
];

const PAYMENT_LABEL: Record<string, string> = Object.fromEntries(
  PAYMENT_METHODS.map((p) => [p.key, p.label]),
);

/** Aceita string porque relatórios devolvem `paymentMethod` sem o tipo estreito. */
export const paymentLabel = (method: string) => PAYMENT_LABEL[method] ?? method;

export const SALE_STATUS_TABS: { key: SaleStatus | "todos"; label: string }[] = [
  { key: "todos", label: "Todas" },
  { key: "COMPLETED", label: "Concluídas" },
  { key: "CANCELED", label: "Canceladas" },
];
