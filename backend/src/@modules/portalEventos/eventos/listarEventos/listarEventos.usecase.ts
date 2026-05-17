import { ApiError } from "src/@modules/shared/apiError";
import { ListarEventosRepository, ListarEventosResult } from "./listarEventosRepository";

export type ListarEventosInput = {
  companyUuid: string;
  status?: string;
  busca?: string;
  pagina?: number;
  porPagina?: number;
};

const STATUS_VALIDOS = ["rascunho", "publicado", "em_vendas", "esgotado", "encerrado", "cancelado"];

export class ListarEventosUsecase {
  constructor(readonly repo: ListarEventosRepository) {}

  async execute(input: ListarEventosInput): Promise<ListarEventosResult> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (input.status && !STATUS_VALIDOS.includes(input.status)) {
      throw new ApiError(`Status inválido. Use: ${STATUS_VALIDOS.join(", ")}`);
    }

    const pagina = Math.max(1, input.pagina ?? 1);
    const porPagina = Math.min(100, Math.max(1, input.porPagina ?? 20));

    return this.repo.listar({
      companyUuid: input.companyUuid,
      status: input.status,
      busca: input.busca,
      pagina,
      porPagina,
    });
  }
}
