import type { ProductDTO } from "@/features/products/api";

export interface CartItem {
  product: ProductDTO;
  qty: number;
}

/** Soma 1 unidade; ignora produto sem estoque e não passa do saldo disponível. */
export function addItem(cart: CartItem[], product: ProductDTO): CartItem[] {
  const found = cart.find((c) => c.product.id === product.id);
  if (found) {
    if (found.qty + 1 > product.totalStock) return cart;
    return cart.map((c) => (c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c));
  }
  if (product.totalStock <= 0) return cart;
  return [...cart, { product, qty: 1 }];
}

/** Ajusta a quantidade; chegando a zero o item sai, e acima do estoque a mudança é ignorada. */
export function changeQty(cart: CartItem[], productId: string, delta: number): CartItem[] {
  return cart.flatMap((c) => {
    if (c.product.id !== productId) return [c];
    const next = c.qty + delta;
    if (next <= 0) return [];
    if (next > c.product.totalStock) return [c];
    return [{ ...c, qty: next }];
  });
}

export function removeItem(cart: CartItem[], productId: string): CartItem[] {
  return cart.filter((c) => c.product.id !== productId);
}

export function cartTotals(cart: CartItem[]) {
  return {
    amount: cart.reduce((sum, c) => sum + c.qty * c.product.price, 0),
    units: cart.reduce((sum, c) => sum + c.qty, 0),
    products: cart.length,
  };
}
