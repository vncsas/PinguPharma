import type { SaleDetail } from "../../../domain/repositories/ISaleRepository.js";

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const dt = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Dinheiro",
  CREDIT: "Crédito",
  DEBIT: "Débito",
  PIX: "PIX",
  OTHER: "Outro",
};

export function renderReceiptHtml(sale: SaleDetail): string {
  const rows = sale.items
    .map(
      (i) => `
      <tr>
        <td>${i.quantity}x</td>
        <td>
          ${escape(i.productName)}
          <small>${escape(i.productSku)}${i.lotNumber ? ` · Lote ${escape(i.lotNumber)}` : ""}</small>
        </td>
        <td class="right">${brl(i.subtotal)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Cupom ${sale.id.slice(-8).toUpperCase()}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
      background: #f1f3f9;
      color: #0a0f1e;
      margin: 0;
      padding: 32px;
      display: flex;
      justify-content: center;
    }
    .receipt {
      background: #fff;
      width: 320px;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 16px -6px rgba(15,23,42,0.12);
      font-size: 12px;
      line-height: 1.5;
    }
    h1 { font-size: 16px; margin: 0 0 4px; }
    .brand { display:flex; align-items:center; gap:8px; margin-bottom: 12px; }
    .logo { width: 28px; height: 28px; border-radius: 6px; background:#2A4BF0; color:#fff; display:grid; place-items:center; font-weight:600; }
    small { display: block; color: #5B6478; font-size: 10px; }
    .row { display: flex; justify-content: space-between; padding: 2px 0; }
    .divider { border-top: 1px dashed #D5D9E3; margin: 12px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 4px 0; vertical-align: top; }
    .right { text-align: right; white-space: nowrap; }
    .total { font-weight: 600; font-size: 14px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; }
    .badge.completed { background: #d5f6e5; color: #12805a; }
    .badge.canceled  { background: #fde3e7; color: #b23146; }
    .actions { margin-top: 16px; display: flex; gap: 8px; }
    button {
      flex: 1; background: #2A4BF0; color: #fff; border: 0; height: 34px;
      border-radius: 8px; font-weight: 500; cursor: pointer;
    }
    button.secondary { background: #fff; color: #0a0f1e; border: 1px solid #D5D9E3; }
    @media print {
      body { background: #fff; padding: 0; }
      .receipt { box-shadow: none; width: 100%; padding: 0; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="brand">
      <div class="logo">P</div>
      <div>
        <h1>PinguPharma</h1>
        <small>Cupom não fiscal · demonstração</small>
      </div>
    </div>
    <div class="row"><span>Nº</span><strong>${sale.id.slice(-8).toUpperCase()}</strong></div>
    <div class="row"><span>Emitido</span><span>${dt(sale.createdAt)}</span></div>
    <div class="row"><span>Vendedor</span><span>${escape(sale.userName)}</span></div>
    <div class="row"><span>Cliente</span><span>${escape(sale.customerName ?? sale.clientName)}</span></div>
    <div class="row"><span>Pagamento</span><span>${PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod}</span></div>
    <div class="row"><span>Status</span><span class="badge ${sale.status === "COMPLETED" ? "completed" : "canceled"}">${sale.status === "COMPLETED" ? "Concluída" : "Cancelada"}</span></div>

    <div class="divider"></div>

    <table>
      <tbody>${rows}</tbody>
    </table>

    <div class="divider"></div>

    <div class="row total"><span>Total</span><span>${brl(sale.totalAmount)}</span></div>
    <p style="text-align:center; margin: 16px 0 0; color:#5B6478;">Obrigado pela preferência!</p>

    <div class="actions">
      <button class="secondary" onclick="window.close()">Fechar</button>
      <button onclick="window.print()">Imprimir</button>
    </div>
  </div>
</body>
</html>`;
}

function escape(s: string | null | undefined) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
