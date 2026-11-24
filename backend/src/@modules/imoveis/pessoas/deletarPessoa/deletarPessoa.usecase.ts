import { ApiError } from "src/@modules/shared/apiError";
import { garantirUuid } from "../../shared/garantirUuid";
import { DeletarPessoaRepository } from "./deletarPessoaRepository";

export type DeletarPessoaInput = {
  companyUuid: string;
  uuid: string;
};

export class DeletarPessoaUsecase {
  constructor(readonly repo: DeletarPessoaRepository) {}

  async execute(input: DeletarPessoaInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    const uuid = garantirUuid(input.uuid, "Pessoa não encontrada");

    const existe = await this.repo.existe(input.companyUuid, uuid);
    if (!existe) throw new ApiError("Pessoa não encontrada", 404);

    if (await this.repo.ehProprietarioDeImovelAtivo(input.companyUuid, uuid)) {
      throw new ApiError("Não é possível excluir pessoa proprietária de imóvel ativo", 409);
    }
    if (await this.repo.temContratoVigente(input.companyUuid, uuid)) {
      throw new ApiError("Não é possível excluir pessoa com contrato vigente", 409);
    }
    await this.repo.deletar(input.companyUuid, uuid);
  }
}
