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

  async execute(input: IncluirCartaoCreditoInput) {}
}
