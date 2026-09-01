import { VerificarPagamentoPeriodoGateway } from "./verificarPagamentoPeriodoGateway";
import { VerificarPagamentoPeriodoRepository } from "./verificarPagamentoPeriodoRepository";

export type VerificarPagamentoPeriodoInput = {
  companyUuid: string;
  dataInicial: string;
  dataFinal: string;
};

export class VerificarPagamentoPeriodoUsecase {
  constructor(
    readonly repo: VerificarPagamentoPeriodoRepository,
    readonly gateway: VerificarPagamentoPeriodoGateway,
  ) {}

  async execute(input: VerificarPagamentoPeriodoInput): Promise<void> {
    const contas = await this.repo.buscarContasBancariasAtivas(input.companyUuid);

    for (const conta of contas) {
      const pagamentos = await this.gateway.listarPagamentosRecebidos(conta, input.dataInicial, input.dataFinal);
      for (const pagamento of pagamentos) {
        await this.repo.verificarPagamento(input.companyUuid, pagamento.id);
      }
    }
  }
}
