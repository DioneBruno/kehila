import { ApiError } from "src/@modules/shared/apiError";
import { DeletarPessoaRepository } from "./deletarPessoaRepository";

export type DeletarPessoaInput = {
  companyUuid: string;
  uuid: string;
};

export class DeletarPessoaUsecase {
  constructor(readonly repo: DeletarPessoaRepository) {}

  async execute(input: DeletarPessoaInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.uuid) throw new ApiError("Pessoa não identificada");

    const existe = await this.repo.existe(input.companyUuid, input.uuid);
    if (!existe) throw new ApiError("Pessoa não encontrada", 404);

    // TODO (Task 5): bloquear (409) quando a pessoa for proprietária de imóvel ou parte de contrato vigente.
    await this.repo.deletar(input.companyUuid, input.uuid);
  }
}
