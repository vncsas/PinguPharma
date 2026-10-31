import type { DispensationDetail } from "../../../domain/repositories/IDispensationRepository.js";

const dt = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);
const day = (d: Date) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);

const STYLE = `  <style>
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
      width: 360px;
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
  </style>`;

export function renderReceiptHtml(d: DispensationDetail): string {
  const code = d.id.slice(-8).toUpperCase();
  const rows = d.items
    .map(
      (i) => `
      <tr>
        <td>${i.quantity}x</td>
        <td>
          ${escape(i.productName)}
          <small>${escape(i.presentation ?? i.productSku)}${i.lotNumber ? ` · Lote ${escape(i.lotNumber)}` : ""}${i.expiresAt ? ` · Val. ${day(i.expiresAt)}` : ""}</small>
        </td>
      </tr>`,
    )
    .join("");

  const prescription = d.prescription
    ? `<div class="row"><span>Receita</span><span>${escape(d.prescription.number ?? d.prescription.id.slice(-8).toUpperCase())}</span></div>
    <div class="row"><span>Prescritor</span><span>${escape(d.prescription.prescriberName)} (${escape(d.prescription.prescriberCouncil)} ${escape(d.prescription.prescriberCouncilNumber)})</span></div>`
    : "";
  const canceled =
    d.status === "CANCELED"
      ? `<div class="row"><span>Motivo do cancelamento</span><span>${escape(d.cancelReason)}</span></div>`
      : "";

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Comprovante de dispensação ${code}</title>
  ${STYLE}
</head>
<body>
  <div class="receipt">
    <div class="brand">
      <div class="logo">P</div>
      <div>
        <h1>PinguPharma</h1>
        <small>Comprovante de dispensação</small>
      </div>
    </div>
    <div class="row"><span>Nº</span><strong>${code}</strong></div>
    <div class="row"><span>Unidade</span><span>${escape(d.unitName)}</span></div>
    <div class="row"><span>Emitido</span><span>${dt(d.createdAt)}</span></div>
    <div class="row"><span>Dispensado por</span><span>${escape(d.userName)}</span></div>
    ${d.pharmacistName ? `<div class="row"><span>Farmacêutico</span><span>${escape(d.pharmacistName)}</span></div>` : ""}
    <div class="row"><span>Paciente</span><span>${escape(d.patientName ?? "Não informado")}</span></div>
    ${d.patientCpf ? `<div class="row"><span>CPF</span><span>${escape(d.patientCpf)}</span></div>` : ""}
    ${d.patientCns ? `<div class="row"><span>CNS</span><span>${escape(d.patientCns)}</span></div>` : ""}
    ${prescription}
    <div class="row"><span>Status</span><span class="badge ${d.status === "COMPLETED" ? "completed" : "canceled"}">${d.status === "COMPLETED" ? "Concluída" : "Cancelada"}</span></div>
    ${canceled}

    <div class="divider"></div>

    <table>
      <tbody>${rows}</tbody>
    </table>

    <div class="divider"></div>

    <p style="margin: 0; color:#5B6478;">
      <strong>Orientações:</strong> siga a posologia prescrita, armazene o medicamento conforme a embalagem
      e procure a unidade em caso de dúvida ou reação adversa.
    </p>

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
