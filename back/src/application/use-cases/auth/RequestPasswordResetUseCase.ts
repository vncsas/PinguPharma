import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { IMailer } from "../../../domain/services/IMailer.js";
import type { ITokenService } from "../../../domain/services/ITokenService.js";

export interface RequestPasswordResetOutput {
  sent: boolean;
  devToken?: string;
}

export class RequestPasswordResetUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly tokens: ITokenService,
    private readonly mailer: IMailer,
    private readonly webBaseUrl: string,
    private readonly exposeDevToken: boolean,
  ) {}

  async execute(email: string): Promise<RequestPasswordResetOutput> {
    const user = await this.users.findByEmail(email.toLowerCase());
    if (!user) return { sent: true };

    const token = this.tokens.signChallenge({ sub: user.id });
    const link = `${this.webBaseUrl}/redefinir-senha?token=${encodeURIComponent(token)}`;
    await this.mailer.send({
      to: user.email,
      subject: "PinguPharma — Redefinição de senha",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
          <h1 style="color:#0A0F1E;font-size:20px;">Solicitação de nova senha</h1>
          <p style="color:#5B6478;">Você (ou alguém) pediu para redefinir sua senha. Se não foi você, ignore este e-mail.</p>
          <p><a href="${link}" style="background:#2A4BF0;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">Redefinir senha</a></p>
          <p style="color:#8A93A6;font-size:12px;">Válido por 5 minutos. Se o botão não funcionar copie: ${link}</p>
        </div>`,
    });
    return { sent: true, devToken: this.exposeDevToken ? token : undefined };
  }
}
