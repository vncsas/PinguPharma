import { escapeHtml } from "../../../shared/utils/escapeHtml.js";

export type { EmailContent } from "../../../domain/services/IEmailTemplates.js";

export function paragraph(text: string): string {
  return `<p style="color:#5B6478;font-size:14px;line-height:1.5;margin:0 0 12px;">${escapeHtml(text)}</p>`;
}

export function button(label: string, url: string): string {
  return `<p style="margin:16px 0;"><a href="${escapeHtml(url)}" style="background:#2A4BF0;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px;display:inline-block;">${escapeHtml(label)}</a></p>`;
}

export function smallPrint(text: string): string {
  return `<p style="color:#8A93A6;font-size:12px;margin:12px 0 0;">${escapeHtml(text)}</p>`;
}

/** `bodyHtml` deve ser montado com os helpers deste módulo ou com dados já escapados. */
export function renderLayout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;background:#F1F3F9;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#2A4BF0;color:#ffffff;padding:16px 24px;border-radius:12px 12px 0 0;font-size:18px;font-weight:600;">PinguPharma</div>
    <div style="background:#ffffff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #E8EAF0;border-top:none;">
      <h1 style="color:#0A0F1E;font-size:20px;margin:0 0 16px;">${escapeHtml(title)}</h1>
      ${bodyHtml}
    </div>
    <p style="color:#8A93A6;font-size:11px;text-align:center;margin:16px 0 0;">Mensagem automática do PinguPharma. Não responda a este e-mail.</p>
  </div>
</body>
</html>`;
}
