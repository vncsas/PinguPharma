import type {
  CreateCustomerData,
  ICustomerRepository,
} from "../../../domain/repositories/ICustomerRepository.js";
import type { Customer } from "../../../domain/entities/Customer.js";

export class CreateCustomerUseCase {
  constructor(private readonly customers: ICustomerRepository) {}

  execute(data: CreateCustomerData): Promise<Customer> {
    return this.customers.create(data);
  }
}
