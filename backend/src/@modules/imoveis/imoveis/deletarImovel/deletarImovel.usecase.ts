import { ApiError } from "src/@modules/shared/apiError";
import { garantirUuid } from "../../shared/garantirUuid";
import { DeletarImovelRepository } from "./deletarImovelRepository";

export type DeletarImovelInput = {
  companyUuid: string;
  uuid: string;
};

export class DeletarImovelUsecase {
  constructor(readonly repo: DeletarImovelRepository) {}

  /** 404 se não existe; 409 se há contrato vigente (checado com o imóvel travado, ver repositório). */
  async execute(input: DeletarImovelInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    const uuid = garantirUuid(input.uuid, "Imóvel não encontrado");
    await this.repo.deletar(input.companyUuid, uuid);
  }
}
