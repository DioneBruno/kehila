import { ApiError } from "src/@modules/shared/apiError";
import { DetalharContaBancariaRepository, ContaBancariaDetalhe } from "./detalharContaBancariaRepository";

export type DetalharContaBancariaInput = {
  companyUuid: string;
  contaBancariaUuid: string;
};

export class DetalharContaBancariaUsecase {
  constructor(readonly repo: DetalharContaBancariaRepository) {}

  async execute(input: DetalharContaBancariaInput): Promise<ContaBancariaDetalhe> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.contaBancariaUuid) throw new ApiError("UUID da conta bancária é obrigatório");

    const conta = await this.repo.buscarPorUuid(input.companyUuid, input.contaBancariaUuid);
    if (!conta) throw new ApiError("Conta bancária não encontrada", 404);

    return conta;
  }
}
