import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { PagamentoEntity } from "./pagamento.entity";
import { ApiDate } from "src/@modules/shared/apiDate";

export class InformarPagamentoManualRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarPagamento(userUuid: string, pagamentoUuid: string) {
    const [pagamentoModel] = await this.connectionHub.database?.query(`SELECT * FROM financeiro_pagamentos WHERE uuid = $1`, [pagamentoUuid]);
    if (!pagamentoModel) return;
    const pagamento = new PagamentoEntity({
      uuid: pagamentoModel.uuid,
      pagoEm: pagamentoModel.pago_em,
      valorPago: pagamentoModel.valor_pago,
      pagoDescricao: pagamentoModel.pago_descricao,
      pagoUserUuid: pagamentoModel.pago_user_uuid,
      status: pagamentoModel.status,
    });
    return pagamento;
  }

  async salvarPagamento(pagamento: PagamentoEntity) {
    await this.connectionHub.database?.query(
      `UPDATE financeiro_pagamentos SET 
      status = $2,
      pago_em = $3,
      valor_pago = $4,
      pago_manual_descricao = $5,
      pago_manual_user_uuid = $6,
      forma_pagamento = $7,
      pago_manual_data = $8
      WHERE uuid = $1`,
      [
        pagamento.uuid(),
        pagamento.status(),
        pagamento.pagoEm(),
        pagamento.valorPago(),
        pagamento.pagoDescricao(),
        pagamento.pagoUserUuid(),
        pagamento.formaPagamento(),
        ApiDate.now(),
      ],
    );
  }
}
