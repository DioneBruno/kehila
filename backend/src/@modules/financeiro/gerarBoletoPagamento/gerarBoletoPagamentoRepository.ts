/* eslint-disable no-unsafe-optional-chaining */
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { PagamentoEntity } from "./pagamento.entity";
import { GerarBoletoPagamentoGatewayAsaas } from "./gerarBoletoPagamentoGateway.asaas";

export class GerarBoletoPagamentoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  buscarGateway(pagamento: PagamentoEntity): GerarBoletoPagamentoGatewayAsaas {
    return new GerarBoletoPagamentoGatewayAsaas(this.connectionHub);
  }

  async buscarPagamento(pagamentoUuid: string) {
    const [pagamentoModel] = await this.connectionHub.database?.query(
      `SELECT
        pagamentos.uuid,
        pagamentos.company_uuid,
        pagamentos.banco_ref,
        pagamentos.valor,
        pagamentos.valor_com_desc_gateway,
        pagamentos.vencimento,
        pagamentos.link_boleto,
        cobrancas.pagador_nome,
        cobrancas.pagador_documento,
        cobrancas.pagador_email,
        cobrancas.pagador_telefone,
        pagamentos.status
      FROM financeiro_pagamentos pagamentos
        INNER JOIN financeiro_cobrancas cobrancas
          ON (pagamentos.cobanca_uuid = cobrancas.uuid)
      WHERE pagamentos.deleted_at IS NULL
        AND pagamentos.uuid = $1`,
      [pagamentoUuid],
    );
    if (!pagamentoModel) return null;

    const pagamento = new PagamentoEntity({
      uuid: pagamentoModel.uuid,
      companyUuid: pagamentoModel.company_uuid,
      pagadorNome: pagamentoModel.pagador_nome,
      pagadorDocumento: pagamentoModel.pagador_documento,
      pagadorEmail: pagamentoModel.pagador_email,
      pagadorTelefone: pagamentoModel.pagador_telefone,
      vencimento: pagamentoModel.vencimento,
      valor: pagamentoModel.valor,
      valorComDescGateway: pagamentoModel.valor_com_desc_gateway,
      status: pagamentoModel.status,
      bancoRef: pagamentoModel.banco_ref,
      linkBoleto: pagamentoModel.link_boleto,
    });
    return pagamento;
  }

  async salvarPagamento(pagamento: PagamentoEntity) {
    await this.connectionHub.database?.query(
      `UPDATE financeiro_pagamentos SET
        banco_ref = $2,
        link_boleto = $3,
        valor = $4,
        valor_com_desc_gateway = $5,
        vencimento = $6
      WHERE uuid = $1`,
      [pagamento.uuid(), pagamento.bancoRef(), pagamento.linkBoleto(), pagamento.valor(), pagamento.valorComDescGateway(), pagamento.vencimento()],
    );
  }
}
