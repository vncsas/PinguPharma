import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { IMailer } from "../../../domain/services/IMailer.js";
import type { IEmailTemplates } from "../../../domain/services/IEmailTemplates.js";
import type { ITokenService } from "../../../domain/services/ITokenService.js";
import type { ILogger } from "../../../domain/services/ILogger.js";

export interface RequestPasswordResetOutput {
  sent: boolean;
  devToken?: string;
}

export class RequestPasswordResetUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly tokens: ITokenService,
    private readonly mailer: IMailer,
    private readonly templates: IEmailTemplates,
    private readonly webBaseUrl: string,
    private readonly exposeDevToken: boolean,
    private readonly logger: ILogger,
  ) {}

  async execute(email: string): Promise<RequestPasswordResetOutput> {
    const user = await this.users.findByEmail(email.toLowerCase());
    if (!user || user.status !== "ACTIVE") return { sent: true };

    const token = this.tokens.signPasswordReset({ sub: user.id, tv: user.tokenVersion });
    const link = `${this.webBaseUrl}/redefinir-senha?token=${encodeURIComponent(token)}`;
    const content = this.templates.passwordReset({ link, expiresInMinutes: 5 });
    void this.mailer.send({ to: user.email, ...content }).catch((err) => {
      this.logger.warn({ err: err instanceof Error ? err.message : String(err) }, "Falha ao enviar e-mail de reset");
    });
    return { sent: true, devToken: this.exposeDevToken ? token : undefined };
  }
}
