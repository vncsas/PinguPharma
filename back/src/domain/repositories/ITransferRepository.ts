import type { TransferDetail, TransferStatus } from "../entities/Transfer.js";

export interface ListTransfersQuery {
  /** Transferências em que a unidade é origem ou destino. */
  unitId?: string;
  direction?: "in" | "out";
  status?: TransferStatus;
  page?: number;
  pageSize?: number;
}

export interface PaginatedTransfers {
  data: TransferDetail[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RequestTransferData {
  fromUnitId: string;
  toUnitId: string;
  requestedBy: string;
  notes?: string | null;
  items: { productId: string; quantity: number }[];
}

export interface ITransferRepository {
  findDetail(id: string): Promise<TransferDetail | null>;
  list(query: ListTransfersQuery): Promise<PaginatedTransfers>;
  /** Pendências da unidade: REQUESTED em que ela é origem + SENT em que ela é destino. */
  countPending(unitId?: string): Promise<number>;
  /** Unidade destino solicita (status REQUESTED, sem efeito em estoque). */
  request(data: RequestTransferData): Promise<TransferDetail>;
  /**
   * REQUESTED -> SENT. Transacional: baixa FEFO na origem, grava TRANSFER_OUT por lote
   * e quebra os itens por lote (batchId/lotNumber/expiresAt/costPrice). ConflictError se faltar estoque.
   */
  send(id: string, userId: string): Promise<TransferDetail>;
  /** SENT -> RECEIVED. Transacional: cria lotes no destino e grava ENTRY_TRANSFER. */
  receive(id: string, userId: string): Promise<TransferDetail>;
  /** REQUESTED/SENT -> REJECTED. Se SENT, devolve estoque à origem (ADJUSTMENT positivo). */
  reject(id: string, userId: string, reason?: string): Promise<TransferDetail>;
  /** REQUESTED/SENT -> CANCELED. Se SENT, devolve estoque à origem (ADJUSTMENT positivo). */
  cancel(id: string, userId: string, reason?: string): Promise<TransferDetail>;
}
