import { ApiDate } from "src/@modules/shared/apiDate";
import { NotificarVencimentoPagamentoRepository } from "./notificarVencimentoPagamentoRepository";

export type NotificarVencimentoPagamentoInput = {
  companyUuid: string;
  diasParaVencimento: number;
}

export class NotificarVencimentoPagamento {
  constructor(readonly repo: NotificarVencimentoPagamentoRepository) {}

  async execute(input: NotificarVencimentoPagamentoInput) {
    const vencimento = ApiDate.format(ApiDate.addDay(ApiDate.now(), input.diasParaVencimento), "YYYY-MM-DD") as string;
    const pagamentos = await this.repo.buscarPagamentos(input.companyUuid, vencimento);
    for (const pagamento of pagamentos) {
      console.log(pagamento.quantidadeNotificacoes());
      if (pagamento.quantidadeNotificacoes() >= 1) continue;
      await this.repo.enviarEmail(pagamento);
      await this.repo.salvarNotificacao(pagamento);
    }
  }
}
