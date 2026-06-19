import { ApiError } from "src/@modules/shared/apiError";
import { ListarUsuariosRepository, ListarUsuariosResult } from "./listarUsuariosRepository";

export type ListarUsuariosInput = {
  companyUuid: string;
  busca?: string;
  pagina?: number;
  porPagina?: number;
};

export class ListarUsuariosUsecase {
  constructor(readonly repo: ListarUsuariosRepository) {}

  async execute(input: ListarUsuariosInput): Promise<ListarUsuariosResult> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);

    const pagina = Math.max(1, input.pagina ?? 1);
    const porPagina = Math.min(100, Math.max(1, input.porPagina ?? 20));

    return this.repo.listar({
      companyUuid: input.companyUuid,
      busca: input.busca,
      pagina,
      porPagina,
    });
  }
}
