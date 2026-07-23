import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { PagamentoEntity } from "./pagamento.entity";
import { EnviarEmailUsecase } from "src/@modules/notificacao/email/enviarEmail.usecase";
import { EnviarEmailRepository } from "src/@modules/notificacao/email/enviarEmailRepository";
import { randomUUID } from "crypto";
import { ApiDate } from "src/@modules/shared/apiDate";

export class NotificarVencimentoPagamentoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarPagamentos(companyUuid: string, vencimento: string): Promise<PagamentoEntity[]> {
    const pagamentosModel = await this.connectionHub.database?.query(`
      SELECT 
        pagamentos.uuid,
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
        AND pagamentos.company_uuid = $1
        AND pagamentos.vencimento = $2
        AND pagamentos.status IN ('pendente', 'PENDING')
      GROUP BY 
        pagamentos.uuid,
        pagamentos.valor,
        pagamentos.vencimento,
        pagamentos.link_boleto,
        cobrancas.pagador_nome,
        cobrancas.pagador_email
      `, [companyUuid, vencimento]);
    const pagamentos = [] as PagamentoEntity[];
    for (const pagamentoModel of pagamentosModel) {
      pagamentos.push(new PagamentoEntity({
        companyUuid,
        uuid: pagamentoModel.uuid,
        pagadorEmail: pagamentoModel.pagador_email,
        pagadorNome: pagamentoModel.pagador_nome,
        valor: pagamentoModel.valor,
        vencimento: pagamentoModel.vencimento,
        linkBoleto: pagamentoModel.link_boleto,
        quantidadeNotificacoes: pagamentoModel.quantidadeNotificacoes,
      }));
    }
    return pagamentos;
  }

  async enviarEmail(pagamento: PagamentoEntity) {
    const repo = new EnviarEmailRepository(this.connectionHub);
    const usecase = new EnviarEmailUsecase(repo);
    await usecase.execute({
      companyUuid: pagamento.companyUuid(),
      destinatario: pagamento.pagadorEmail(),
      titulo: "Aviso de Vencimento",
      mensagem: `Prezado(a) ${pagamento.pagadorNome()},
        informamos que o pagamento no valor de R$ ${pagamento.valor()} vencerá em ${pagamento.vencimento()}.
        Para efetuar o pagamento, clique no link: ${pagamento.linkBoleto()}`
    });
  }

  async salvarNotificacao(pagamento: PagamentoEntity) {
    await this.connectionHub.database?.query(`INSERT INTO financeiro_pagamento_notificacoes (uuid, company_uuid, pagamento_uuid, tipo, data_envio)
      VALUES ($1, $2, $3, $4, $5)`, [randomUUID(), pagamento.companyUuid(), pagamento.uuid(), "email", ApiDate.now()]);
  }
}
