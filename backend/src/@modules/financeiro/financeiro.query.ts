import { ApiDate } from "../shared/apiDate";
import { ConnectionHub } from "../shared/connections/connectionHub";
import { VerificarPagamentoUsecase } from "./verificarPagamento/verificarPagamento.usecase";
import { VerificarPagamentoGateway } from "./verificarPagamento/verificarPagamentoGateway";
import { VerificarPagamentoRepostiory } from "./verificarPagamento/verificarPagamentoRepository";
import { VerificarPagamentoPeriodoUsecase } from "./verificarPagamentoPeriodo/verificarPagamentoPeriodo.usecase";
import { VerificarPagamentoPeriodoGateway } from "./verificarPagamentoPeriodo/verificarPagamentoPeriodoGateway";
import { VerificarPagamentoPeriodoRepository } from "./verificarPagamentoPeriodo/verificarPagamentoPeriodoRepository";

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

  async verificarPagamentosCompanies() {
    if (![true, "true", 1, "1"].includes(process.env.VERIFICAR_PAGAMENTOS_COMPANIES as any)) return;

    const companiesModel = await this.connectionHub.database?.query(`SELECT uuid FROM auth_companies WHERE deleted_at IS NULL`);
    console.log("Verificando pagamento Inicio: ", ApiDate.now());
    for (const company of companiesModel) {
      const hoje = ApiDate.now("YYYY-MM-DD");
      const dataInicial = ApiDate.subtractDay(hoje, 1);
      const repo = new VerificarPagamentoPeriodoRepository(this.connectionHub);
      const gateway = new VerificarPagamentoPeriodoGateway(this.connectionHub);
      const usecase = new VerificarPagamentoPeriodoUsecase(repo, gateway);
      await usecase.execute({ companyUuid: company.uuid, dataInicial, dataFinal: hoje });
    }
    console.log("Verificando pagamento FIM: ", ApiDate.now());
  }
}
