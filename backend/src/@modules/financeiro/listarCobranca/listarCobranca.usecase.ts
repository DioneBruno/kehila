import { ApiError } from "src/@modules/shared/apiError";
import { ListarCobrancaRepository, ListarCobrancaResult } from "./listarCobrancaRepository";

export type ListarCobrancaInput = {
  companyUuid: string;
  busca?: string;
  status?: string;
  pagina?: number;
  porPagina?: number;
};

export class ListarCobrancaUsecase {
  constructor(readonly repo: ListarCobrancaRepository) {}

  async execute(input: ListarCobrancaInput): Promise<ListarCobrancaResult> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);

    const pagina = Math.max(1, input.pagina ?? 1);
    const porPagina = Math.min(100, Math.max(1, input.porPagina ?? 20));

    return this.repo.listar({
      companyUuid: input.companyUuid,
      busca: input.busca,
      status: input.status,
      pagina,
      porPagina,
    });
  }
}
