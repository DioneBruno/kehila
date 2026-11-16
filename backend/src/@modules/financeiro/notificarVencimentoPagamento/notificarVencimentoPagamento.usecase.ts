import { ApiDate } from "src/@modules/shared/apiDate";
import { NotificarVencimentoPagamentoRepository } from "./notificarVencimentoPagamentoRepository";

export type NotificarVencimentoPagamentoInput = {
  /** Quando informado (requisições HTTP), restringe os pagamentos à empresa. */
  companyUuid?: string;
  diasParaVencimento?: number;
  forcarEnvio?: boolean;
  pagamentosUuid?: string[];
};

export class NotificarVencimentoPagamentoUsecase {
  constructor(readonly repo: NotificarVencimentoPagamentoRepository) {}

  async execute(input: NotificarVencimentoPagamentoInput) {
    const pagamentos = input.pagamentosUuid
      ? await this.repo.buscarPagamentosPorUuids(input.pagamentosUuid, input.companyUuid)
      : await this.repo.buscarPagamentos(ApiDate.format(ApiDate.addDay(ApiDate.now(), input.diasParaVencimento), "YYYY-MM-DD") as string);
    for (const pagamento of pagamentos) {
      if (!input.forcarEnvio && pagamento.quantidadeNotificacoes() >= 1) continue;
      await this.repo.enviarEmail(pagamento);
      await this.repo.salvarNotificacao(pagamento);
    }
  }
}
