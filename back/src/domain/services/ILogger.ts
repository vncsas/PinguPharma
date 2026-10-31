export interface ILogger {
  warn(obj: Record<string, unknown>, msg: string): void;
}
