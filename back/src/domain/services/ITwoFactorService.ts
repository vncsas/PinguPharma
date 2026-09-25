export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export interface ITwoFactorService {
  generateSecret(accountName: string): Promise<TwoFactorSetup>;
  verify(secret: string, token: string): boolean;
}
