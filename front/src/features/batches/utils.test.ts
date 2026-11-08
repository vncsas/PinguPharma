import { describe, expect, it } from "vitest";
import type { BatchDTO } from "./api";
import { daysUntil, summarizeBatches } from "./utils";

const NOW = new Date("2026-06-01T12:00:00Z").getTime();
const batch = (daysAhead: number, quantity: number): BatchDTO =>
  ({ expiresAt: new Date(NOW + daysAhead * 24 * 3600 * 1000).toISOString(), quantity }) as BatchDTO;

describe("batches utils", () => {
  it("daysUntil devolve dias inteiros e negativo para vencidos", () => {
    expect(daysUntil(batch(10, 1).expiresAt, NOW)).toBe(10);
    expect(daysUntil(batch(-3, 1).expiresAt, NOW)).toBe(-3);
  });

  it("summarizeBatches soma unidades e conta os que vencem em 30 dias", () => {
    const summary = summarizeBatches([batch(5, 10), batch(40, 20), batch(-1, 2)], NOW);
    expect(summary).toEqual({ total: 3, units: 32, expiringSoon: 2 });
  });
});
