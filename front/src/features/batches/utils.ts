import type { BatchDTO } from "./api";

const DAY_MS = 24 * 3600 * 1000;

/** Dias inteiros até a validade (negativo = vencido). */
export function daysUntil(expiresAt: string, now = Date.now()) {
  return Math.floor((new Date(expiresAt).getTime() - now) / DAY_MS);
}

export function summarizeBatches(rows: BatchDTO[], now = Date.now()) {
  return {
    total: rows.length,
    units: rows.reduce((sum, r) => sum + r.quantity, 0),
    expiringSoon: rows.filter((r) => new Date(r.expiresAt).getTime() - now < 30 * DAY_MS).length,
  };
}
