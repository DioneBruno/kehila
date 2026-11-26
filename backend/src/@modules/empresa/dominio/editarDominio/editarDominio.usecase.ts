import { ApiError } from "src/@modules/shared/apiError";
import { DominioRegrasRepository, garantirActiveBooleano, garantirDominioLivre, garantirNaoEhUltimoAtivo, normalizarDominio } from "../dominioRegras";
import { EditarDominioRepository } from "./editarDominioRepository";

export type EditarDominioInput = {
  companyUuid: string;
  dominioUuid: string;
  domain?: string;
  active?: boolean;
};

export class EditarDominioUsecase {
  constructor(
    readonly repo: EditarDominioRepository,
    readonly regras: DominioRegrasRepository,
  ) {}

  async execute(input: EditarDominioInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.dominioUuid) throw new ApiError("UUID do domínio é obrigatório");
    garantirActiveBooleano(input.active);
    const domain = input.domain !== undefined ? normalizarDominio(input.domain) : undefined;

    const existe = await this.repo.existe(input.companyUuid, input.dominioUuid);
    if (!existe) throw new ApiError("Domínio não encontrado", 404);

    if (domain !== undefined) {
      await garantirDominioLivre(this.regras, domain, input.dominioUuid);
    } else if (input.active === true) {
      const atual = await this.regras.buscarDominio(input.companyUuid, input.dominioUuid);
      if (atual) await garantirDominioLivre(this.regras, normalizarDominio(atual), input.dominioUuid);
    }
    if (input.active === false) await garantirNaoEhUltimoAtivo(this.regras, input.companyUuid, input.dominioUuid);

    await this.repo.atualizar(input.companyUuid, input.dominioUuid, {
      domain,
      active: input.active,
    });
  }
}
