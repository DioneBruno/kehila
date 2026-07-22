import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ApiDate } from "src/@modules/shared/apiDate";
import { ApiError } from "src/@modules/shared/apiError";
import { PagamentoEntity } from "./pagamento.entity";
import { EnviarEmailUsecase } from "src/@modules/notificacao/email/enviarEmail.usecase";
import { EnviarEmailRepository } from "src/@modules/notificacao/email/enviarEmailRepository";

export class VerificarPagamentoRepostiory {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarPagamento(companyUuid: string, pagamentoUuid: string): Promise<PagamentoEntity> {
    const [pagamentoModel] = await this.connectionHub.database!.query(
      `SELECT
          pagamentos.uuid,
          pagamentos.company_uuid,
          pagamentos.status,
          pagamentos.banco_ref,
          pagamentos.pago_em,
          pagamentos.valor_pago,
          cobrancas.user_uuid
        FROM financeiro_pagamentos pagamentos
        INNER JOIN financeiro_cobrancas cobrancas
          ON pagamentos.cobanca_uuid = cobrancas.uuid
        WHERE pagamentos.uuid = $1
        AND pagamentos.company_uuid = $2
        AND pagamentos.deleted_at IS NULL`,
      [pagamentoUuid, companyUuid],
    );
    if (!pagamentoModel) throw new ApiError("Pagamento não encontrado", 400);

    const [usuario] = await this.connectionHub.database?.query(`SELECT uuid, name, email FROM auth_users WHERE uuid = $1`, [pagamentoModel.user_uuid]);

    return new PagamentoEntity({
      uuid: pagamentoModel.uuid,
      usuario,
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

  async enviarEmail(pagamento: PagamentoEntity) {
    if (!pagamento.usuario()?.email) return;
    const repo = new EnviarEmailRepository(this.connectionHub);
    const usecase = new EnviarEmailUsecase(repo);
    const template = `Pagamento recebido no valor de ${pagamento.valorPago()}`;

    await usecase.execute({
      companyUuid: pagamento.companyUuid(),
      destinatario: pagamento.usuario().email,
      titulo: "Pagamento Recebido",
      mensagem: template,
    });
  }
}
