import type { IMailer, MailMessage } from "../../domain/services/IMailer.js";
import { logger } from "../../shared/logger.js";
import { env } from "../../config/env.js";

export class ConsoleMailer implements IMailer {
  async send(msg: MailMessage): Promise<void> {
    logger.info({ to: msg.to, subject: msg.subject }, `[Mail:DEV] ${msg.subject} → ${msg.to}`);
    if (env.NODE_ENV === "development" && env.EXPOSE_DEV_RESET_TOKEN) {
      const match = msg.html.match(/https?:\/\/[^\s"'<>]*token=([^\s"'<>&]+)/);
      if (match) {
        const t = decodeURIComponent(match[1]);
        const masked = t.length > 12 ? `${t.slice(0, 6)}...${t.slice(-4)}` : "***";
        logger.debug({ link: match[0].replace(match[1], masked) }, "[Mail:DEV] link");
      }
    }
  }
}
