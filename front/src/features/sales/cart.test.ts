import { describe, expect, it } from "vitest";
import type { ProductDTO } from "@/features/products/api";
import { addItem, cartTotals, changeQty, removeItem } from "./cart";

const product = (over: Partial<ProductDTO> = {}): ProductDTO =>
  ({ id: "p1", name: "Dipirona", sku: "DIP-500", price: 10, totalStock: 3, ...over }) as ProductDTO;

describe("cart", () => {
  it("adiciona o produto e soma a quantidade nas próximas adições", () => {
    let cart = addItem([], product());
    cart = addItem(cart, product());
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(2);
  });

  it("não adiciona produto sem estoque", () => {
    expect(addItem([], product({ totalStock: 0 }))).toEqual([]);
  });

  it("não passa do estoque disponível", () => {
    let cart = addItem([], product({ totalStock: 1 }));
    cart = addItem(cart, product({ totalStock: 1 }));
    expect(cart[0].qty).toBe(1);
  });

  it("changeQty respeita estoque e remove o item ao chegar em zero", () => {
    const base = addItem([], product());
    expect(changeQty(base, "p1", +1)[0].qty).toBe(2);
    expect(changeQty(changeQty(base, "p1", +1), "p1", +5)[0].qty).toBe(2);
    expect(changeQty(base, "p1", -1)).toEqual([]);
  });

  it("removeItem tira só o produto informado", () => {
    const cart = addItem(addItem([], product()), product({ id: "p2" }));
    expect(removeItem(cart, "p1").map((c) => c.product.id)).toEqual(["p2"]);
  });

  it("cartTotals soma valor, unidades e produtos", () => {
    let cart = addItem([], product({ price: 10 }));
    cart = addItem(cart, product({ price: 10 }));
    cart = addItem(cart, product({ id: "p2", price: 5 }));
    expect(cartTotals(cart)).toEqual({ amount: 25, units: 3, products: 2 });
  });
});
