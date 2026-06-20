import { ApiError } from "src/@modules/shared/apiError";
import { IncluirCartaoCreditoRepository } from "./incluirCartaoCreditoRepository";

export type IncluirCartaoCreditoInput = {
  companyUuid: string;
  userUuid: string;
  cartaoCredito: {
    nomeNoCartao: string;
    numeroCartao: string;
    mesVencimento: string;
    anoVencimento: string;
    codigoSeguranca: string;
  };
};

export class IncluirCartaoCreditoUsecase {
  constructor(readonly repo: IncluirCartaoCreditoRepository) {}

  async execute(input: IncluirCartaoCreditoInput) {
    const contaBancaria = await this.repo.buscarContaBancaria(input.companyUuid);
    if (!contaBancaria) throw new ApiError("Conta bancária não encontrada");
    const gateway = this.repo.buscarGateway(contaBancaria);
    const usuario = this.repo.buscarUsuario(input.userUuid);
  }
}
