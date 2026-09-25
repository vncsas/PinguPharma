import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepository.js";
import type { Customer } from "../../../domain/entities/Customer.js";

export class ListCustomersUseCase {
  constructor(private readonly customers: ICustomerRepository) {}

  execute(search?: string): Promise<Customer[]> {
    return this.customers.list(search);
  }
}
