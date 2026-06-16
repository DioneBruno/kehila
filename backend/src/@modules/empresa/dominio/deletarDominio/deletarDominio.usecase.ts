import { ApiError } from "src/@modules/shared/apiError";
import { DeletarDominioRepository } from "./deletarDominioRepository";

export type DeletarDominioInput = {
  companyUuid: string;
  dominioUuid: string;
};

export class DeletarDominioUsecase {
  constructor(readonly repo: DeletarDominioRepository) {}

  async execute(input: DeletarDominioInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.dominioUuid) throw new ApiError("UUID do domínio é obrigatório");

    const existe = await this.repo.existe(input.companyUuid, input.dominioUuid);
    if (!existe) throw new ApiError("Domínio não encontrado", 404);

    await this.repo.deletar(input.companyUuid, input.dominioUuid);
  }
}
