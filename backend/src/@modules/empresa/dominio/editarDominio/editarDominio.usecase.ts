import { ApiError } from "src/@modules/shared/apiError";
import { EditarDominioRepository } from "./editarDominioRepository";

export type EditarDominioInput = {
  companyUuid: string;
  dominioUuid: string;
  domain?: string;
  active?: boolean;
};

export class EditarDominioUsecase {
  constructor(readonly repo: EditarDominioRepository) {}

  async execute(input: EditarDominioInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.dominioUuid) throw new ApiError("UUID do domínio é obrigatório");
    if (input.domain !== undefined && !input.domain.trim()) throw new ApiError("O domínio é obrigatório");

    const existe = await this.repo.existe(input.companyUuid, input.dominioUuid);
    if (!existe) throw new ApiError("Domínio não encontrado", 404);

    await this.repo.atualizar(input.companyUuid, input.dominioUuid, {
      domain: input.domain?.trim(),
      active: input.active,
    });
  }
}
