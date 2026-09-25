import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepository.js";
import { NotFoundError } from "../../../shared/errors/AppError.js";

export class DeleteCustomerUseCase {
  constructor(private readonly customers: ICustomerRepository) {}

  async execute(id: string): Promise<void> {
    const c = await this.customers.findById(id);
    if (!c) throw new NotFoundError("Customer");
    await this.customers.delete(id);
  }
}
