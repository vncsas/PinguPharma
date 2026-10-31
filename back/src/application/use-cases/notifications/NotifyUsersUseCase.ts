import type { INotificationRepository } from "../../../domain/repositories/INotificationRepository.js";
import type { NotificationType } from "../../../domain/entities/Notification.js";
import type { IMailer } from "../../../domain/services/IMailer.js";
import type { ILogger } from "../../../domain/services/ILogger.js";
import type { EmailContent } from "../../../domain/services/IEmailTemplates.js";
import { resolvePreference } from "./preferences.js";

export interface NotifyRecipient {
  id: string;
  email: string;
}

export interface NotifyInput {
  recipients: NotifyRecipient[];
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  dedupeKey?: string | null;
  /** Se informado, é enviado aos destinatários com preferência de e-mail ativa. */
  email?: EmailContent;
}

export interface NotifyResult {
  userId: string;
  email: string;
  inAppCreated: boolean;
  /** E-mail permitido pela preferência e não duplicado (dedupeKey). */
  emailAllowed: boolean;
  emailSent: boolean;
}

export class NotifyUsersUseCase {
  constructor(
    private readonly notifications: INotificationRepository,
    private readonly mailer: IMailer,
    private readonly logger: ILogger,
  ) {}

  /** Best-effort: nunca lança; falhas por destinatário são registradas em warn. */
  async execute(input: NotifyInput): Promise<NotifyResult[]> {
    const results: NotifyResult[] = [];
    for (const r of input.recipients) {
      const result: NotifyResult = {
        userId: r.id,
        email: r.email,
        inAppCreated: false,
        emailAllowed: false,
        emailSent: false,
      };
      try {
        const stored = await this.notifications.getPreferences(r.id);
        const pref = resolvePreference(stored, input.type);
        let duplicate = false;
        if (pref.inApp) {
          const created = await this.notifications.create({
            userId: r.id,
            type: input.type,
            title: input.title,
            body: input.body,
            link: input.link ?? null,
            dedupeKey: input.dedupeKey ?? null,
          });
          result.inAppCreated = created !== null;
          duplicate = created === null;
        }
        result.emailAllowed = pref.email && !duplicate;
        if (result.emailAllowed && input.email) {
          await this.mailer.send({ to: r.email, subject: input.email.subject, html: input.email.html });
          result.emailSent = true;
        }
      } catch (err) {
        this.logger.warn(
          { userId: r.id, type: input.type, err: err instanceof Error ? err.message : String(err) },
          "Falha ao notificar usuário",
        );
      }
      results.push(result);
    }
    return results;
  }
}
