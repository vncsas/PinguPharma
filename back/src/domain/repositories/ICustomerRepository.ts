import type { Customer } from "../entities/Customer.js";

export interface CreateCustomerData {
  name: string;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface UpdateCustomerData {
  name?: string;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ICustomerRepository {
  list(search?: string): Promise<Customer[]>;
  findById(id: string): Promise<Customer | null>;
  create(data: CreateCustomerData): Promise<Customer>;
  update(id: string, data: UpdateCustomerData): Promise<Customer>;
  delete(id: string): Promise<void>;
}
