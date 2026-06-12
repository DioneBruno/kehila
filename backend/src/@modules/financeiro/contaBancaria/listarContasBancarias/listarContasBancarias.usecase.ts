import { ApiError } from "src/@modules/shared/apiError";
import { ListarContasBancariasRepository, ListarContasBancariasResult } from "./listarContasBancariasRepository";

export type ListarContasBancariasInput = {
  companyUuid: string;
  busca?: string;
  status?: string;
  pagina?: number;
  porPagina?: number;
};

export class ListarContasBancariasUsecase {
  constructor(readonly repo: ListarContasBancariasRepository) {}

  async execute(input: ListarContasBancariasInput): Promise<ListarContasBancariasResult> {
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
