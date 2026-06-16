import { ApiError } from "src/@modules/shared/apiError";
import { DeletarEmpresaRepository } from "./deletarEmpresaRepository";

export type DeletarEmpresaInput = {
  companyUuid: string;
};

export class DeletarEmpresaUsecase {
  constructor(readonly repo: DeletarEmpresaRepository) {}

  async execute(input: DeletarEmpresaInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);

    const existe = await this.repo.existe(input.companyUuid);
    if (!existe) throw new ApiError("Empresa não encontrada", 404);

    await this.repo.deletar(input.companyUuid);
  }
}
