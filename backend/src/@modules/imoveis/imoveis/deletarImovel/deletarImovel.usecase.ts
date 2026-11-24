import { ApiError } from "src/@modules/shared/apiError";
import { garantirUuid } from "../../shared/garantirUuid";
import { DeletarImovelRepository } from "./deletarImovelRepository";

export type DeletarImovelInput = {
  companyUuid: string;
  uuid: string;
};

export class DeletarImovelUsecase {
  constructor(readonly repo: DeletarImovelRepository) {}

  async execute(input: DeletarImovelInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    const uuid = garantirUuid(input.uuid, "Imóvel não encontrado");

    const situacao = await this.repo.buscarSituacao(input.companyUuid, uuid);
    if (!situacao) throw new ApiError("Imóvel não encontrado", 404);
    if (await this.repo.temContratoVigente(input.companyUuid, uuid)) throw new ApiError("Não é possível excluir imóvel com contrato vigente", 409);

    await this.repo.deletar(input.companyUuid, uuid);
  }
}
