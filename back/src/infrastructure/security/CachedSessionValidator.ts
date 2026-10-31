import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { ISessionValidator } from "../../domain/services/ISessionValidator.js";
import { UnauthorizedError } from "../../shared/errors/AppError.js";

interface Entry {
  status: string;
  tokenVersion: number;
  expiresAt: number;
}

export class CachedSessionValidator implements ISessionValidator {
  private readonly cache = new Map<string, Entry>();
  private users?: IUserRepository;

  constructor(private readonly ttlMs = 30_000) {}

  bind(users: IUserRepository): void {
    this.users = users;
  }

  invalidate(userId: string): void {
    this.cache.delete(userId);
  }

  async assertValid(userId: string, tokenVersion: number | undefined): Promise<void> {
    let entry = this.cache.get(userId);
    if (!entry || entry.expiresAt < Date.now()) {
      const user = await this.users!.findById(userId);
      if (!user) {
        this.cache.delete(userId);
        throw new UnauthorizedError("Sessão inválida");
      }
      entry = { status: user.status, tokenVersion: user.tokenVersion, expiresAt: Date.now() + this.ttlMs };
      this.cache.set(userId, entry);
    }
    if (entry.status !== "ACTIVE") throw new UnauthorizedError("Sessão inválida");
    if (typeof tokenVersion !== "number" || tokenVersion !== entry.tokenVersion) {
      throw new UnauthorizedError("Sessão expirada");
    }
  }
}
