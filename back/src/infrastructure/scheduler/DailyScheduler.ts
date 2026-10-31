import type { ILogger } from "../../domain/services/ILogger.js";

/**
 * Agendador diário sem dependências: confere a cada minuto e executa o job
 * uma única vez por dia, a partir da hora configurada (idempotente).
 */
export class DailyScheduler {
  private timer: NodeJS.Timeout | null = null;
  private lastRunDay: string | null = null;
  private running = false;

  constructor(
    private readonly job: () => Promise<void>,
    private readonly hour: number,
    private readonly logger: ILogger,
    private readonly checkEveryMs: number = 60_000,
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.tick(), this.checkEveryMs);
    this.timer.unref();
    void this.tick();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    const now = new Date();
    const day = now.toLocaleDateString("sv-SE");
    if (this.running || this.lastRunDay === day || now.getHours() < this.hour) return;
    this.running = true;
    this.lastRunDay = day;
    try {
      await this.job();
    } catch (err) {
      this.lastRunDay = null;
      this.logger.warn({ err: err instanceof Error ? err.message : String(err) }, "Falha no agendador de alertas");
    } finally {
      this.running = false;
    }
  }
}
