import { VerificarPagamentoGateway } from "./verificarPagamentoGateway";
import { VerificarPagamentoRepostiory } from "./verificarPagamentoRepository";

export type VerificarPagamentoInput = {
  companyUuid: string;
  pagamentoUuid: string;
};

export class VerificarPagamentoUsecase {
  constructor(
    readonly verificarPagamentoRepository: VerificarPagamentoRepostiory,
    readonly verificarPagamentoGateway: VerificarPagamentoGateway,
  ) {}

  async execute(input: VerificarPagamentoInput) {}
}
