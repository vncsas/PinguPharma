import nodemailer, { type Transporter } from "nodemailer";
import type { IMailer, MailMessage } from "../../domain/services/IMailer.js";

export interface SmtpMailerOptions {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export class SmtpMailer implements IMailer {
  private readonly transporter: Transporter;

  constructor(private readonly options: SmtpMailerOptions) {
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      auth: { user: options.user, pass: options.pass },
    });
  }

  async send(msg: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.options.from,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
    });
  }
}
