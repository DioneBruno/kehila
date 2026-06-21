import { ConnectionHub } from "../shared/connections/connectionHub";
import { VerificarPagamentoUsecase } from "./verificarPagamento/verificarPagamento.usecase";
import { VerificarPagamentoGateway } from "./verificarPagamento/verificarPagamentoGateway";
import { VerificarPagamentoRepostiory } from "./verificarPagamento/verificarPagamentoRepository";

export class FinanceiroQuery {
  constructor(readonly connectionHub: ConnectionHub) {}

  async verificarPagamentoPeriodo(companyUuid: string, vencimentoInicial: string, vencimentoFinal: string) {
    const pagamentosModel = await this.connectionHub.database?.query(
      `SELECT uuid
      FROM financeiro_pagamentos pagamentos
      WHERE company_uuid = $1
        AND vencimento BETWEEN $2 AND $3`,
      [companyUuid, vencimentoInicial, vencimentoFinal],
    );

    const repo = new VerificarPagamentoRepostiory(this.connectionHub);
    const gateway = new VerificarPagamentoGateway(this.connectionHub);
    const usecase = new VerificarPagamentoUsecase(repo, gateway);
    for (const pagamento of pagamentosModel) {
      await usecase.execute({ companyUuid, pagamentoUuid: pagamento.uuid });
    }
  }

  async removerCartaoCredito(cartaoUuid: string) {
    await this.connectionHub.database?.query(`UPDATE financeiro_cartao_credito SET deleted_at = now() WHERE uuid = $1`, [cartaoUuid]);
  }
}
