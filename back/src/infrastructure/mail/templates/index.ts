import { escapeHtml } from "../../../shared/utils/escapeHtml.js";
import { button, paragraph, renderLayout, smallPrint, type EmailContent } from "./layout.js";

import type { AlertsEmailData, IEmailTemplates } from "../../../domain/services/IEmailTemplates.js";

export function passwordResetEmail(input: { link: string; expiresInMinutes: number }): EmailContent {
  return {
    subject: "PinguPharma — Redefinição de senha",
    html: renderLayout(
      "Solicitação de nova senha",
      paragraph("Você (ou alguém) pediu para redefinir sua senha. Se não foi você, ignore este e-mail.") +
        button("Redefinir senha", input.link) +
        smallPrint(`Válido por ${input.expiresInMinutes} minutos. Se o botão não funcionar, copie: ${input.link}`),
    ),
  };
}

const TD = "padding:6px 10px;border-bottom:1px solid #E8EAF0;font-size:13px;";

function table(headers: string[], rows: string[][]): string {
  const head = headers
    .map((h) => `<th style="padding:6px 10px;text-align:left;font-size:12px;">${escapeHtml(h)}</th>`)
    .join("");
  const body = rows
    .map((r) => `<tr>${r.map((c) => `<td style="${TD}">${escapeHtml(c)}</td>`).join("")}</tr>`)
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin:8px 0 16px;"><thead><tr style="background:#F1F3F9;">${head}</tr></thead><tbody>${body}</tbody></table>`;
}

const fmt = (d: Date) => d.toLocaleDateString("pt-BR");

export function alertsEmail(data: AlertsEmailData): EmailContent {
  const MAX = 20;
  const sections: string[] = [];
  const batchRows = (list: AlertsEmailData["expired"]) =>
    list.slice(0, MAX).map((b) => [b.productName, b.lotNumber, `${b.quantity} un.`, fmt(b.expiresAt)]);
  const more = (n: number) => (n > MAX ? smallPrint(`... e mais ${n - MAX} item(ns).`) : "");

  if (data.expired.length) {
    sections.push(
      paragraph(`${data.expired.length} lote(s) já vencido(s) com estoque.`) +
        table(["Produto", "Lote", "Qtd", "Venceu em"], batchRows(data.expired)) +
        more(data.expired.length),
    );
  }
  if (data.expiringSoon.length) {
    sections.push(
      paragraph(`${data.expiringSoon.length} lote(s) vencendo em até ${data.daysAhead} dias.`) +
        table(["Produto", "Lote", "Qtd", "Validade"], batchRows(data.expiringSoon)) +
        more(data.expiringSoon.length),
    );
  }
  if (data.lowStock.length) {
    sections.push(
      paragraph(`${data.lowStock.length} produto(s) com estoque abaixo do mínimo.`) +
        table(
          ["Produto", "SKU", "Estoque", "Mínimo"],
          data.lowStock.slice(0, MAX).map((p) => [p.name, p.sku, String(p.totalStock), String(p.minStockAlert)]),
        ) +
        more(data.lowStock.length),
    );
  }

  const critical = data.critical ?? [];
  if (critical.length) {
    sections.push(
      paragraph(`${critical.length} produto(s) com estoque crítico (cobertura de até 7 dias).`) +
        table(
          ["Produto", "SKU", "Estoque", "Cobertura"],
          critical.slice(0, MAX).map((p) => [p.name, p.sku, String(p.currentStock), p.coverageDays === null ? "ruptura" : `${p.coverageDays} dia(s)`]),
        ) +
        more(critical.length),
    );
  }

  const unitSuffix = data.unitName ? ` — ${data.unitName}` : "";
  return {
    subject: `PinguPharma${unitSuffix} — Alertas de ${data.date}: ${data.expired.length} vencido(s), ${data.expiringSoon.length} a vencer, ${data.lowStock.length} estoque baixo, ${critical.length} crítico(s)`,
    html: renderLayout(`Alertas diários (${data.date})${unitSuffix}`, sections.join("") + button("Abrir notificações", data.link)),
  };
}

export function welcomeEmail(input: { name: string; email: string; setPasswordLink: string; validHours: number }): EmailContent {
  return {
    subject: "PinguPharma — Bem-vindo(a)",
    html: renderLayout(
      `Olá, ${input.name}`,
      paragraph(`Sua conta no PinguPharma foi criada com o e-mail ${input.email}.`) +
        paragraph("Por segurança, a senha não é enviada por e-mail. Defina a sua senha pelo botão abaixo.") +
        button("Definir minha senha", input.setPasswordLink) +
        smallPrint(`O link vale por ${input.validHours} horas. Depois disso, use "Esqueci minha senha" na tela de login.`),
    ),
  };
}

export function passwordResetByAdminEmail(input: { name: string; loginLink: string }): EmailContent {
  return {
    subject: "PinguPharma — Sua senha foi redefinida",
    html: renderLayout(
      "Senha redefinida por um administrador",
      paragraph(`Olá, ${input.name}. Um administrador redefiniu a sua senha de acesso.`) +
        paragraph("Use a senha informada por ele e altere-a no seu perfil assim que entrar. Se você não esperava isso, avise a administração.") +
        button("Ir para o login", input.loginLink),
    ),
  };
}

export function passwordChangedEmail(input: { name: string; loginLink: string }): EmailContent {
  return {
    subject: "PinguPharma — Sua senha foi alterada",
    html: renderLayout(
      "Senha alterada",
      paragraph(`Olá, ${input.name}. A senha da sua conta foi alterada agora há pouco.`) +
        paragraph("Se não foi você, redefina sua senha imediatamente e avise a administração.") +
        button("Ir para o login", input.loginLink),
    ),
  };
}

export function twoFactorChangedEmail(input: { name: string; enabled: boolean }): EmailContent {
  const state = input.enabled ? "ativada" : "desativada";
  return {
    subject: `PinguPharma — Verificação em duas etapas ${state}`,
    html: renderLayout(
      `Verificação em duas etapas ${state}`,
      paragraph(`Olá, ${input.name}. A verificação em duas etapas (2FA) da sua conta foi ${state}.`) +
        paragraph("Se não foi você, altere sua senha e avise a administração."),
    ),
  };
}

export function dispensationCanceledEmail(input: {
  code: string;
  unitName: string;
  canceledBy: string;
  reason: string;
  link: string;
}): EmailContent {
  return {
    subject: `PinguPharma — Dispensação cancelada (${input.code})`,
    html: renderLayout(
      "Dispensação cancelada",
      paragraph(`A dispensação ${input.code} da unidade ${input.unitName} foi cancelada por ${input.canceledBy}.`) +
        paragraph(`Motivo: ${input.reason}`) +
        paragraph("O estoque dos lotes foi devolvido.") +
        button("Ver dispensações", input.link),
    ),
  };
}

export function transferNoticeEmail(input: { title: string; message: string; link: string }): EmailContent {
  return {
    subject: `PinguPharma — ${input.title}`,
    html: renderLayout(input.title, paragraph(input.message) + button("Abrir transferências", input.link)),
  };
}

export const emailTemplates: IEmailTemplates = {
  passwordReset: passwordResetEmail,
  alerts: alertsEmail,
  welcome: welcomeEmail,
  passwordResetByAdmin: passwordResetByAdminEmail,
  passwordChanged: passwordChangedEmail,
  twoFactorChanged: twoFactorChangedEmail,
  dispensationCanceled: dispensationCanceledEmail,
  transferNotice: transferNoticeEmail,
};
