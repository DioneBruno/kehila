import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { PagamentoEntity } from "./pagamento.entity";
import { EnviarEmailUsecase } from "src/@modules/notificacao/email/enviarEmail.usecase";
import { EnviarEmailRepository } from "src/@modules/notificacao/email/enviarEmailRepository";
import { randomUUID } from "crypto";
import { ApiDate } from "src/@modules/shared/apiDate";

export class NotificarVencimentoPagamentoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarPagamentos(vencimento: string): Promise<PagamentoEntity[]> {
    const pagamentosModel = await this.connectionHub.database?.query(
      `
      SELECT 
        pagamentos.uuid,
        pagamentos.company_uuid,
        pagamentos.valor,
        pagamentos.vencimento,
        pagamentos.link_boleto,
        cobrancas.pagador_nome,
        cobrancas.pagador_email,
        count(notificacoes.uuid) as "quantidadeNotificacoes"
      FROM financeiro_pagamentos pagamentos
      JOIN financeiro_cobrancas cobrancas
        ON cobrancas.uuid = pagamentos.cobanca_uuid
      LEFT JOIN financeiro_pagamento_notificacoes notificacoes
        ON notificacoes.pagamento_uuid = pagamentos.uuid
      WHERE pagamentos.deleted_at IS NULL
        AND cobrancas.deleted_at IS NULL
        AND pagamentos.vencimento = $1
        AND pagamentos.status IN ('pendente', 'PENDING')
      GROUP BY 
        pagamentos.uuid,
        pagamentos.valor,
        pagamentos.vencimento,
        pagamentos.link_boleto,
        cobrancas.pagador_nome,
        cobrancas.pagador_email
      `,
      [vencimento],
    );
    const pagamentos = [] as PagamentoEntity[];
    for (const pagamentoModel of pagamentosModel) {
      pagamentos.push(
        new PagamentoEntity({
          companyUuid: pagamentoModel.company_uuid,
          uuid: pagamentoModel.uuid,
          pagadorEmail: pagamentoModel.pagador_email,
          pagadorNome: pagamentoModel.pagador_nome,
          valor: pagamentoModel.valor,
          vencimento: pagamentoModel.vencimento,
          linkBoleto: pagamentoModel.link_boleto,
          quantidadeNotificacoes: pagamentoModel.quantidadeNotificacoes,
        }),
      );
    }
    return pagamentos;
  }

  async buscarPagamentosPorUuids(pagamentosUuid: string[]): Promise<PagamentoEntity[]> {
    const pagamentosModel = await this.connectionHub.database?.query(
      `
      SELECT
        pagamentos.uuid,
        pagamentos.company_uuid,
        pagamentos.valor,
        pagamentos.vencimento,
        pagamentos.link_boleto,
        cobrancas.pagador_nome,
        cobrancas.pagador_email,
        count(notificacoes.uuid) as "quantidadeNotificacoes"
      FROM financeiro_pagamentos pagamentos
      JOIN financeiro_cobrancas cobrancas
        ON cobrancas.uuid = pagamentos.cobanca_uuid
      LEFT JOIN financeiro_pagamento_notificacoes notificacoes
        ON notificacoes.pagamento_uuid = pagamentos.uuid
      WHERE pagamentos.deleted_at IS NULL
        AND cobrancas.deleted_at IS NULL
        AND pagamentos.uuid = ANY($1)
      GROUP BY
        pagamentos.uuid,
        pagamentos.company_uuid,
        pagamentos.valor,
        pagamentos.vencimento,
        pagamentos.link_boleto,
        cobrancas.pagador_nome,
        cobrancas.pagador_email
      `,
      [pagamentosUuid],
    );
    const pagamentos = [] as PagamentoEntity[];
    for (const pagamentoModel of pagamentosModel) {
      pagamentos.push(
        new PagamentoEntity({
          companyUuid: pagamentoModel.company_uuid,
          uuid: pagamentoModel.uuid,
          pagadorEmail: pagamentoModel.pagador_email,
          pagadorNome: pagamentoModel.pagador_nome,
          valor: pagamentoModel.valor,
          vencimento: pagamentoModel.vencimento,
          linkBoleto: pagamentoModel.link_boleto,
          quantidadeNotificacoes: pagamentoModel.quantidadeNotificacoes,
        }),
      );
    }
    return pagamentos;
  }

  async enviarEmail(pagamento: PagamentoEntity) {
    const repo = new EnviarEmailRepository(this.connectionHub);
    const usecase = new EnviarEmailUsecase(repo);

    const valorFormatado = (pagamento.valor() ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const template = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background-color: #f5f5f5;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; text-align: center;">
          <h1 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Aviso de Vencimento</h1>
          <p style="color: #4a4a4a; font-size: 14px; margin: 0 0 24px;">
            Prezado(a) ${pagamento.pagadorNome()}, o pagamento abaixo está próximo do vencimento.
          </p>
          <div style="display: inline-block; background-color: #f0f0f0; border-radius: 6px; padding: 16px 32px; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: bold; color: #1a1a1a;">R$ ${valorFormatado}</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 8px;">
            <tr>
              <td style="color: #8a8a8a; font-size: 12px; padding: 8px 0; border-top: 1px solid #eeeeee;">Vencimento</td>
              <td style="color: #1a1a1a; font-size: 12px; padding: 8px 0; border-top: 1px solid #eeeeee; text-align: right;">${ApiDate.format(pagamento.vencimento(), "DD/MM/YYYY")}</td>
            </tr>
          </table>
          <a href="${pagamento.linkBoleto()}" style="display: inline-block; margin-top: 24px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; padding: 12px 32px; border-radius: 6px;">
            Pagar boleto
          </a>
          <p style="color: #8a8a8a; font-size: 12px; margin: 24px 0 0;">
            Evite juros e multas, efetue o pagamento até a data de vencimento.
          </p>
        </div>
      </div>
    `;

    await usecase.execute({
      companyUuid: pagamento.companyUuid(),
      destinatario: pagamento.pagadorEmail(),
      titulo: "Aviso de Vencimento",
      mensagem: template,
    });
  }

  async salvarNotificacao(pagamento: PagamentoEntity) {
    await this.connectionHub.database?.query(
      `INSERT INTO financeiro_pagamento_notificacoes (uuid, company_uuid, pagamento_uuid, tipo, data_envio)
      VALUES ($1, $2, $3, $4, $5)`,
      [randomUUID(), pagamento.companyUuid(), pagamento.uuid(), "email", ApiDate.now()],
    );
  }
}
