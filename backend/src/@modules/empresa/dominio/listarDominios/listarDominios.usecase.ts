import { ApiError } from "src/@modules/shared/apiError";
import { ListarDominiosRepository, DominioListItem } from "./listarDominiosRepository";

export type ListarDominiosInput = {
  companyUuid: string;
};

export class ListarDominiosUsecase {
  constructor(readonly repo: ListarDominiosRepository) {}

  async execute(input: ListarDominiosInput): Promise<DominioListItem[]> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);

    return this.repo.listar(input.companyUuid);
  }
}
