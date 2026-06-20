import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ApiDate } from "src/@modules/shared/apiDate";
import { ApiError } from "src/@modules/shared/apiError";
import { PagamentoEntity } from "./pagamento.entity";

export class VerificarPagamentoRepostiory {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarPagamento(companyUuid: string, pagamentoUuid: string): Promise<PagamentoEntity> {
    const [pagamentoModel] = await this.connectionHub.database!.query(
      `SELECT * FROM financeiro_pagamentos WHERE uuid = $1 AND company_uuid = $2 AND deleted_at IS NULL`,
      [pagamentoUuid, companyUuid],
    );
    if (!pagamentoModel) throw new ApiError("Pagamento não encontrado", 400);

    return new PagamentoEntity({
      uuid: pagamentoModel.uuid,
      companyUuid: pagamentoModel.company_uuid,
      status: pagamentoModel.status,
      bancoRef: pagamentoModel.banco_ref,
      pagoEm: pagamentoModel.pago_em,
      valorPago: parseFloat(pagamentoModel.valor_pago),
    });
  }

  async atualizarPagamento(pagamento: PagamentoEntity): Promise<void> {
    await this.connectionHub.database!.query(
      `UPDATE financeiro_pagamentos SET status = $1, pago_em = $2, valor_pago = $3, updated_at = $4 WHERE uuid = $5 AND company_uuid = $6`,
      [pagamento.status(), pagamento.pagoEm(), pagamento.valorPago(), ApiDate.now(), pagamento.uuid(), pagamento.companyUuid()],
    );
  }
}
