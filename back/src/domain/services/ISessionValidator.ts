export interface ISessionValidator {
  /** Lança UnauthorizedError se o usuário não existir, não estiver ACTIVE ou o tokenVersion divergir. */
  assertValid(userId: string, tokenVersion: number | undefined): Promise<void>;
  invalidate(userId: string): void;
}
