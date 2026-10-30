import { describe, expect, it } from "vitest";
import { brl, cn, dayShort } from "./utils";

describe("utils", () => {
  it("brl formata em reais", () => {
    expect(brl(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50");
  });

  it("dayShort formata dia/mês", () => {
    expect(dayShort(new Date(2026, 0, 5))).toBe("05/01");
  });

  it("cn resolve conflitos do tailwind", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
