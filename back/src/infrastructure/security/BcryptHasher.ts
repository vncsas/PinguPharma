import bcrypt from "bcryptjs";
import type { IHasher } from "../../domain/services/IHasher.js";

export class BcryptHasher implements IHasher {
  constructor(private readonly rounds = 12) {}

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
