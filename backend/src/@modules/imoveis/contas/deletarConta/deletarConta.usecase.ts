import { ApiError } from "src/@modules/shared/apiError";
import { garantirUuid } from "../../shared/garantirUuid";
import { MSG_CONTA_NAO_ENCONTRADA } from "../conta.entity";
import { DeletarContaRepository } from "./deletarContaRepository";

export type DeletarContaInput = { companyUuid: string; uuid: string };

export class DeletarContaUsecase {
  constructor(readonly repo: DeletarContaRepository) {}

  async execute(input: DeletarContaInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    const uuid = garantirUuid(input.uuid, MSG_CONTA_NAO_ENCONTRADA);
    await this.repo.deletar(input.companyUuid, uuid);
  }
}
