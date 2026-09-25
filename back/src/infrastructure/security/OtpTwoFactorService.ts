import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import type { ITwoFactorService, TwoFactorSetup } from "../../domain/services/ITwoFactorService.js";

export class OtpTwoFactorService implements ITwoFactorService {
  constructor(private readonly issuer: string) {}

  async generateSecret(accountName: string): Promise<TwoFactorSetup> {
    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: this.issuer,
      label: accountName,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret,
    });
    const otpauthUrl = totp.toString();
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return { secret: secret.base32, otpauthUrl, qrCodeDataUrl };
  }

  verify(secret: string, token: string): boolean {
    const totp = new OTPAuth.TOTP({
      issuer: this.issuer,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  }
}
