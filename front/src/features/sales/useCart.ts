import { useCallback, useMemo, useState } from "react";
import type { ProductDTO } from "@/features/products/api";
import { addItem, cartTotals, changeQty, removeItem, type CartItem } from "./cart";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = useCallback((product: ProductDTO) => setItems((c) => addItem(c, product)), []);
  const updateQty = useCallback(
    (productId: string, delta: number) => setItems((c) => changeQty(c, productId, delta)),
    [],
  );
  const remove = useCallback((productId: string) => setItems((c) => removeItem(c, productId)), []);
  const clear = useCallback(() => setItems([]), []);
  const totals = useMemo(() => cartTotals(items), [items]);

  return { items, totals, add, updateQty, remove, clear };
}
