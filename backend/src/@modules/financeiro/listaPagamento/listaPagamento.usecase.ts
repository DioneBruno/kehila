import { ApiError } from "src/@modules/shared/apiError";
import { ListaPagamentoRepository, ListaPagamentoResult } from "./listaPagamentoRepository";

export type ListaPagamentoInput = {
  companyUuid: string;
  busca?: string;
  status?: string;
  pagina?: number;
  porPagina?: number;
};

export class ListaPagamentoUsecase {
  constructor(readonly repo: ListaPagamentoRepository) {}

  async execute(input: ListaPagamentoInput): Promise<ListaPagamentoResult> {
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
