import { randomUUID } from "crypto";
import { ConnectionHub } from "../../shared/connections/connectionHub";
import { CobrancaEntity } from "./cobranca.entity";
import { GerarCobrancaGatewayAsaas, GerarCobrancaOutput } from "./gerarCorbancaGateway.asaas";

export class GerarCobrancaRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  buscarGateway() {
    const gateway = new GerarCobrancaGatewayAsaas(this.connectionHub);
    return gateway;
  }

  async savarCobranca(cobranca: CobrancaEntity): Promise<void> {
    await this.connectionHub.database!.query(
      `INSERT INTO financeiro_cobrancas (uuid, company_uuid, user_uuid, origem_tipo, origem_uuid, pagador_nome, pagador_documento, pagador_email, pagador_telefone, valor, banco_ref)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        cobranca.uuid(),
        cobranca.companyUuid(),
        cobranca.userUuid(),
        cobranca.origem(),
        cobranca.origemUuid(),
        cobranca.pagadorNome(),
        cobranca.pagadorDocumento(),
        cobranca.pagadorEmail(),
        cobranca.pagadorTelefone(),
        cobranca.valor(),
        cobranca.bancoRef(),
      ],
    );
  }

  async savarPagamentos(cobranca: CobrancaEntity, pagamentos: GerarCobrancaOutput["pagamentos"]): Promise<void> {
    for (const pagamento of pagamentos) {
      await this.connectionHub.database!.query(
        `INSERT INTO financeiro_pagamentos (uuid, company_uuid, user_uuid, cobanca_uuid, forma_pagamento, vencimento, valor, valor_com_desc_gateway, banco_ref, nosso_numero, link_boleto, codigo_barras, linha_digitavel, pix)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          randomUUID(),
          cobranca.companyUuid(),
          cobranca.userUuid(),
          cobranca.uuid(),
          "boleto",
          pagamento.vancimento,
          pagamento.valorCobranca,
          pagamento.valorComDescontoGateway,
          pagamento.gatewayRef,
          pagamento.nossoNumero,
          pagamento.linkBoleto,
          pagamento.codigoBarras,
          pagamento.linhaDigitavel,
          pagamento.pix,
        ],
      );
    }
  }
}
