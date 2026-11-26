import { ApiError } from "src/@modules/shared/apiError";
import { DominioRegrasRepository, garantirDominioLivre, normalizarDominio } from "../dominioRegras";
import { CriarDominioRepository, DominioCriado } from "./criarDominioRepository";

export type CriarDominioInput = {
  companyUuid: string;
  domain?: string;
  active?: boolean;
};

export class CriarDominioUsecase {
  constructor(
    readonly repo: CriarDominioRepository,
    readonly regras: DominioRegrasRepository,
  ) {}

  async execute(input: CriarDominioInput): Promise<DominioCriado> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    const domain = normalizarDominio(input.domain);
    await garantirDominioLivre(this.regras, domain);

    return this.repo.criar({
      companyUuid: input.companyUuid,
      domain,
      active: input.active,
    });
  }
}
