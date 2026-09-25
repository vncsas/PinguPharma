import type { IMailer, MailMessage } from "../../domain/services/IMailer.js";
import { logger } from "../../shared/logger.js";

export class ConsoleMailer implements IMailer {
  async send(msg: MailMessage): Promise<void> {
    logger.info(
      { to: msg.to, subject: msg.subject },
      `[Mail:DEV] ${msg.subject} → ${msg.to}`,
    );
    logger.debug({ html: msg.html }, "[Mail:DEV] payload");
  }
}
