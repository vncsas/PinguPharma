export interface EmailContent {
  subject: string;
  html: string;
}

export interface AlertsEmailData {
  date: string;
  daysAhead: number;
  link: string;
  expiringSoon: Array<{ productName: string; lotNumber: string; quantity: number; expiresAt: Date }>;
  expired: Array<{ productName: string; lotNumber: string; quantity: number; expiresAt: Date }>;
  lowStock: Array<{ name: string; sku: string; totalStock: number; minStockAlert: number }>;
  critical?: Array<{ name: string; sku: string; currentStock: number; coverageDays: number | null }>;
  unitName?: string;
}

export interface IEmailTemplates {
  passwordReset(input: { link: string; expiresInMinutes: number }): EmailContent;
  alerts(data: AlertsEmailData): EmailContent;
  welcome(input: { name: string; email: string; setPasswordLink: string; validHours: number }): EmailContent;
  passwordResetByAdmin(input: { name: string; loginLink: string }): EmailContent;
  passwordChanged(input: { name: string; loginLink: string }): EmailContent;
  twoFactorChanged(input: { name: string; enabled: boolean }): EmailContent;
  dispensationCanceled(input: {
    code: string;
    unitName: string;
    canceledBy: string;
    reason: string;
    link: string;
  }): EmailContent;
  transferNotice(input: { title: string; message: string; link: string }): EmailContent;
}
