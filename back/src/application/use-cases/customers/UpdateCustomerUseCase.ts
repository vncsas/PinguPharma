import type {
  ICustomerRepository,
  UpdateCustomerData,
} from "../../../domain/repositories/ICustomerRepository.js";
import type { Customer } from "../../../domain/entities/Customer.js";
import { NotFoundError } from "../../../shared/errors/AppError.js";

export class UpdateCustomerUseCase {
  constructor(private readonly customers: ICustomerRepository) {}

  async execute(id: string, data: UpdateCustomerData): Promise<Customer> {
    const existing = await this.customers.findById(id);
    if (!existing) throw new NotFoundError("Customer");
    return this.customers.update(id, data);
  }
}
