import { ApiError } from "src/@modules/shared/apiError";
import { garantirUuid } from "../../shared/garantirUuid";
import { DeletarPessoaRepository } from "./deletarPessoaRepository";

export type DeletarPessoaInput = {
  companyUuid: string;
  uuid: string;
};

export class DeletarPessoaUsecase {
  constructor(readonly repo: DeletarPessoaRepository) {}

  /** 404 se não existe; 409 se é proprietária de imóvel ativo ou parte de contrato vigente (checado com a pessoa travada). */
  async execute(input: DeletarPessoaInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    const uuid = garantirUuid(input.uuid, "Pessoa não encontrada");
    await this.repo.deletar(input.companyUuid, uuid);
  }
}
