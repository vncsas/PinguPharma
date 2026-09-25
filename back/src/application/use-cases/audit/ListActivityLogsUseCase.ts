import type {
  IActivityLogRepository,
  ListActivityLogsQuery,
  PaginatedActivityLogs,
} from "../../../domain/repositories/IActivityLogRepository.js";

export class ListActivityLogsUseCase {
  constructor(private readonly logs: IActivityLogRepository) {}

  execute(query: ListActivityLogsQuery): Promise<PaginatedActivityLogs> {
    return this.logs.list(query);
  }

  async facets(): Promise<{ entities: string[]; actions: string[] }> {
    const [entities, actions] = await Promise.all([
      this.logs.distinctEntities(),
      this.logs.distinctActions(),
    ]);
    return { entities, actions };
  }
}
