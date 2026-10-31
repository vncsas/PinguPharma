export interface Patient {
  id: string;
  name: string;
  cns: string | null;
  cpf: string | null;
  birthDate: Date | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
