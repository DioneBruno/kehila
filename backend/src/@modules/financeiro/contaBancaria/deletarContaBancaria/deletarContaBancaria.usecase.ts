import { ApiError } from "src/@modules/shared/apiError";
import { DeletarContaBancariaRepository } from "./deletarContaBancariaRepository";

export type DeletarContaBancariaInput = {
  companyUuid: string;
  contaBancariaUuid: string;
};

export class DeletarContaBancariaUsecase {
  constructor(readonly repo: DeletarContaBancariaRepository) {}

  async execute(input: DeletarContaBancariaInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.contaBancariaUuid) throw new ApiError("UUID da conta bancária é obrigatório");

    const existe = await this.repo.existe(input.companyUuid, input.contaBancariaUuid);
    if (!existe) throw new ApiError("Conta bancária não encontrada", 404);

    await this.repo.deletar(input.companyUuid, input.contaBancariaUuid);
  }
}
