/**
 * Solicitar boleto de um pagamento
 * para o gateway
 */
import { GerarBoletoPagamentoRepository } from "./gerarBoletoPagamentoRepository";

export type GerarBoletoPagamentoInput = {
  pagamentoUuid: string;
};

export class GerarBoletoPagamentoUsecase {
  constructor(readonly repo: GerarBoletoPagamentoRepository) {}

  async execute(input: GerarBoletoPagamentoInput) {}
}
