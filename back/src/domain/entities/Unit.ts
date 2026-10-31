export type UnitType = "UBS" | "UPA" | "CENTRAL" | "HOSPITAL" | "OTHER";

export interface Unit {
  id: string;
  name: string;
  cnes: string | null;
  type: UnitType;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
