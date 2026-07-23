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
          pagamentos.vencimento,
          pagamentos.valor_pago,
          cobrancas.user_uuid,
          cobrancas.pagador_nome,
          cobrancas.pagador_email
        FROM financeiro_pagamentos pagamentos
        INNER JOIN financeiro_cobrancas cobrancas
          ON pagamentos.cobanca_uuid = cobrancas.uuid
        WHERE pagamentos.uuid = $1
        AND pagamentos.company_uuid = $2
        AND pagamentos.deleted_at IS NULL`,
      [pagamentoUuid, companyUuid],
    );
    if (!pagamentoModel) throw new ApiError("Pagamento não encontrado", 400);

    return new PagamentoEntity({
      uuid: pagamentoModel.uuid,
      usuario: { uuid: pagamentoModel.user_uuid, name: pagamentoModel.pagador_nome, email: pagamentoModel.pagador_email },
      companyUuid: pagamentoModel.company_uuid,
      status: pagamentoModel.status,
      bancoRef: pagamentoModel.banco_ref,
      vencimento: pagamentoModel.vencimento,
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

    const valorFormatado = (pagamento.valorPago() ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const template = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background-color: #f5f5f5;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; text-align: center;">
          <h1 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Pagamento recebido</h1>
          <p style="color: #4a4a4a; font-size: 14px; margin: 0 0 24px;">
            Olá, ${pagamento.usuario().name}! Confirmamos o recebimento do seu pagamento.
          </p>
          <div style="display: inline-block; background-color: #f0f0f0; border-radius: 6px; padding: 16px 32px; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: bold; color: #1a1a1a;">R$ ${valorFormatado}</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 8px;">
            <tr>
              <td style="color: #8a8a8a; font-size: 12px; padding: 8px 0; border-top: 1px solid #eeeeee;">Vencimento</td>
              <td style="color: #1a1a1a; font-size: 12px; padding: 8px 0; border-top: 1px solid #eeeeee; text-align: right;">${ApiDate.format(pagamento.vencimento(), "DD/MM/YYYY")}</td>
            </tr>
            <tr>
              <td style="color: #8a8a8a; font-size: 12px; padding: 8px 0; border-top: 1px solid #eeeeee;">Pago em</td>
              <td style="color: #1a1a1a; font-size: 12px; padding: 8px 0; border-top: 1px solid #eeeeee; text-align: right;">${ApiDate.format(pagamento.pagoEm(), "DD/MM/YYYY")}</td>
            </tr>
          </table>
          <p style="color: #8a8a8a; font-size: 12px; margin: 16px 0 0;">
            Obrigado por manter seu pagamento em dia.
          </p>
        </div>
      </div>
    `;

    await usecase.execute({
      companyUuid: pagamento.companyUuid(),
      destinatario: pagamento.usuario().email,
      titulo: "Pagamento Recebido",
      mensagem: template,
    });
  }
}
