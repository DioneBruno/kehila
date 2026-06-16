import { ApiError } from "src/@modules/shared/apiError";
import { CriarDominioRepository, DominioCriado } from "./criarDominioRepository";

export type CriarDominioInput = {
  companyUuid: string;
  domain?: string;
  active?: boolean;
};

export class CriarDominioUsecase {
  constructor(readonly repo: CriarDominioRepository) {}

  async execute(input: CriarDominioInput): Promise<DominioCriado> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.domain?.trim()) throw new ApiError("O domínio é obrigatório");

    return this.repo.criar({
      companyUuid: input.companyUuid,
      domain: input.domain.trim(),
      active: input.active,
    });
  }
}
