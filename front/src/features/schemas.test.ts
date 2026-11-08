import { describe, expect, it } from "vitest";
import { changePasswordSchema, loginSchema, resetPasswordSchema } from "./auth/schemas";
import { batchSchema } from "./batches/schemas";
import { customerSchema, toCustomerInput } from "./customers/schemas";
import { productSchema } from "./products/schemas";
import { createUserSchema } from "./users/schemas";

const firstError = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.error?.issues[0]?.message;

describe("auth", () => {
  it("login exige e-mail válido e senha mínima", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "123456" }).success).toBe(true);
    expect(firstError(loginSchema.safeParse({ email: "x", password: "123456" }))).toBe("E-mail inválido");
    expect(loginSchema.safeParse({ email: "a@b.com", password: "123" }).success).toBe(false);
  });

  it("troca de senha exige confirmação igual e nova senha com 8+", () => {
    const base = { current: "antiga", next: "novasenha1", confirm: "novasenha1" };
    expect(changePasswordSchema.safeParse(base).success).toBe(true);

    const mismatch = changePasswordSchema.safeParse({ ...base, confirm: "outra" });
    expect(mismatch.success).toBe(false);
    expect(mismatch.error?.issues[0].path).toEqual(["confirm"]);

    expect(changePasswordSchema.safeParse({ ...base, next: "curta", confirm: "curta" }).success).toBe(false);
  });

  it("redefinição valida confirmação", () => {
    expect(resetPasswordSchema.safeParse({ password: "12345678", confirm: "12345679" }).success).toBe(false);
  });
});

describe("users", () => {
  it("rejeita role desconhecido e senha curta", () => {
    const ok = { name: "Ana", email: "a@b.com", password: "12345678", role: "SELLER" };
    expect(createUserSchema.safeParse(ok).success).toBe(true);
    expect(createUserSchema.safeParse({ ...ok, role: "ROOT" }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...ok, password: "123" }).success).toBe(false);
  });
});

describe("customers", () => {
  const base = { name: "Maria", document: "", phone: "", email: "" };

  it("aceita campos opcionais em branco e e-mail vazio", () => {
    expect(customerSchema.safeParse(base).success).toBe(true);
    expect(customerSchema.safeParse({ ...base, email: "invalido" }).success).toBe(false);
  });

  it("toCustomerInput troca vazios por null", () => {
    expect(toCustomerInput(base)).toEqual({ name: "Maria", document: null, phone: null, email: null });
    expect(toCustomerInput({ ...base, phone: "1199" }).phone).toBe("1199");
  });
});

describe("products", () => {
  const base = { name: "Dipirona", sku: "dip-500", description: "", price: 9.9, minStockAlert: 5, active: true };

  it("normaliza o SKU para maiúsculas", () => {
    const r = productSchema.safeParse(base);
    expect(r.success && r.data.sku).toBe("DIP-500");
  });

  it("exige preço positivo e estoque mínimo inteiro não negativo", () => {
    expect(productSchema.safeParse({ ...base, price: 0 }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, price: NaN }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, minStockAlert: -1 }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, minStockAlert: 1.5 }).success).toBe(false);
  });
});

describe("batches", () => {
  const base = { productId: "p1", lotNumber: "l2026", quantity: 10, costPrice: 0, expiresAt: "2027-01-01" };

  it("normaliza o lote e aceita custo zero", () => {
    const r = batchSchema.safeParse(base);
    expect(r.success && r.data.lotNumber).toBe("L2026");
  });

  it("exige produto, quantidade positiva e validade", () => {
    expect(batchSchema.safeParse({ ...base, productId: "" }).success).toBe(false);
    expect(batchSchema.safeParse({ ...base, quantity: 0 }).success).toBe(false);
    expect(batchSchema.safeParse({ ...base, expiresAt: "" }).success).toBe(false);
  });
});
