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

  async execute(input: VerificarPagamentoInput): Promise<void> {
    const pagamento = await this.verificarPagamentoRepository.buscarPagamento(input.companyUuid, input.pagamentoUuid);

    const resultado = await this.verificarPagamentoGateway.verificarPagamento(pagamento);
    if (!resultado) return;

    pagamento.receber(resultado.dataPagamento, resultado.valorPago);
    await this.verificarPagamentoRepository.atualizarPagamento(pagamento);
  }
}
