import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ContaBancariaAtiva } from "./verificarPagamentoPeriodoGateway";
import { VerificarPagamentoUsecase } from "../verificarPagamento/verificarPagamento.usecase";
import { VerificarPagamentoRepostiory } from "../verificarPagamento/verificarPagamentoRepository";
import { VerificarPagamentoGateway } from "../verificarPagamento/verificarPagamentoGateway";

export class VerificarPagamentoPeriodoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarContasBancariasAtivas(companyUuid: string): Promise<ContaBancariaAtiva[]> {
    const contas = await this.connectionHub.database!.query<{ company_uuid: string; chave_api: string; ambiente: string }[]>(
      `SELECT company_uuid, chave_api, ambiente
      FROM financeiro_contas_bancarias
      WHERE deleted_at IS NULL
        AND company_uuid = $1
        AND status = 'ativo'`,
      [companyUuid],
    );
    return contas.map((conta) => ({
      companyUuid: conta.company_uuid,
      chaveApi: conta.chave_api,
      ambiente: conta.ambiente,
    }));
  }

  async verificarPagamento(companyUuid, pagamentoGatewayId: string) {
    const [pagamentoModel] = await this.connectionHub.database?.query(`SELECT uuid FROM financeiro_pagamentos WHERE banco_ref = $1`, [
      pagamentoGatewayId,
    ]);
    if (!pagamentoModel) return;
    const repo = new VerificarPagamentoRepostiory(this.connectionHub);
    const gateway = new VerificarPagamentoGateway(this.connectionHub);
    const usecase = new VerificarPagamentoUsecase(repo, gateway);
    const input = {
      companyUuid,
      pagamentoUuid: pagamentoModel.uuid,
    };
    await usecase.execute(input);
  }
}
