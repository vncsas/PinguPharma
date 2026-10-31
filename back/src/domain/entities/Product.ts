export type ControlledClass =
  | "NONE"
  | "A1"
  | "A2"
  | "A3"
  | "B1"
  | "B2"
  | "C1"
  | "C2"
  | "C3"
  | "C4"
  | "C5";

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  /** Valor de referência (prestação de contas), não preço de venda. */
  price: number;
  minStockAlert: number;
  active: boolean;
  controlledClass: ControlledClass;
  activeIngredient: string | null;
  presentation: string | null;
  measureUnit: string | null;
  manufacturer: string | null;
  renameCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithStock extends Product {
  totalStock: number;
  nearestExpiration: Date | null;
  batchCount: number;
}
