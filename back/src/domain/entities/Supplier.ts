export type SupplierType = "BIDDING" | "DONATION" | "MUNICIPAL_CENTRAL" | "OTHER";

export interface Supplier {
  id: string;
  name: string;
  cnpj: string | null;
  type: SupplierType;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
