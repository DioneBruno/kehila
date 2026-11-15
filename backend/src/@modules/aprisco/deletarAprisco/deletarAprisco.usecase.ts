import { ApiError } from "src/@modules/shared/apiError";
import { DeletarApriscoRepository } from "./deletarApriscoRepository";

export type DeletarApriscoInput = {
  companyUuid: string;
  apriscoUuid: string;
};

export class DeletarApriscoUsecase {
  constructor(readonly repo: DeletarApriscoRepository) {}

  async execute(input: DeletarApriscoInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.apriscoUuid) throw new ApiError("Aprisco não identificado");

    const existe = await this.repo.existe(input.companyUuid, input.apriscoUuid);
    if (!existe) throw new ApiError("Aprisco não encontrado", 404);

    await this.repo.deletar(input.companyUuid, input.apriscoUuid);
  }
}
