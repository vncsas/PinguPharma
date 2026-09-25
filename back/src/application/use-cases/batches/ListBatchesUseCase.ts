import type {
  IBatchRepository,
  ListBatchesQuery,
  PaginatedBatches,
} from "../../../domain/repositories/IBatchRepository.js";

export class ListBatchesUseCase {
  constructor(private readonly batches: IBatchRepository) {}

  execute(query: ListBatchesQuery): Promise<PaginatedBatches> {
    return this.batches.list(query);
  }
}
