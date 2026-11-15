import { ApiError } from "src/@modules/shared/apiError";
import { DeletarMembroRepository } from "./deletarMembroRepository";

export type DeletarMembroInput = {
  companyUuid: string;
  membroUuid: string;
};

export class DeletarMembroUsecase {
  constructor(readonly repo: DeletarMembroRepository) {}

  async execute(input: DeletarMembroInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.membroUuid) throw new ApiError("Membro não identificado");

    const existe = await this.repo.existe(input.companyUuid, input.membroUuid);
    if (!existe) throw new ApiError("Membro não encontrado", 404);

    await this.repo.deletar(input.companyUuid, input.membroUuid);
  }
}
