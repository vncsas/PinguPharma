import type { IMailer, MailMessage } from "../../domain/services/IMailer.js";
import type { ILogger } from "../../domain/services/ILogger.js";

function maskEmail(to: string): string {
  return to.replace(/([^@\s,])[^@\s,]*@/g, "$1***@");
}

/** Decorator: falha de envio nunca propaga; apenas registra warn. */
export class SafeMailer implements IMailer {
  constructor(
    private readonly inner: IMailer,
    private readonly logger: ILogger,
  ) {}

  async send(msg: MailMessage): Promise<void> {
    try {
      await this.inner.send(msg);
    } catch (err) {
      this.logger.warn(
        { to: maskEmail(msg.to), subject: msg.subject, err: err instanceof Error ? err.message : String(err) },
        "Falha ao enviar e-mail",
      );
    }
  }
}
