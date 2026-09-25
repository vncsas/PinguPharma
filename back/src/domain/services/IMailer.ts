export interface MailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface IMailer {
  send(msg: MailMessage): Promise<void>;
}
