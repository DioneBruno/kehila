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

  async execute(input: GerarBoletoPagamentoInput) {
    const pagamento = await this.repo.buscarPagamento(input.pagamentoUuid);
    if (!pagamento) throw new Error("Pagamento não encontrado");
    const gateway = this.repo.buscarGateway(pagamento);
    await gateway.gerarBoleto(pagamento);
    await this.repo.salvarPagamento(pagamento);
  }
}
