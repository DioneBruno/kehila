import { randomUUID } from "crypto";
import { ConnectionHub } from "../../shared/connections/connectionHub";
import { CobrancaEntity } from "./cobranca.entity";
import { GerarCobrancaGatewayAsaas } from "./gerarCorbancaGateway.asaas";
import { UsuarioEntity } from "./usuario.entity";
import { PagamentoEntity } from "./pagamento.entity";

export class GerarCobrancaRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  buscarGateway() {
    const gateway = new GerarCobrancaGatewayAsaas(this.connectionHub);
    return gateway;
  }

  async buscarUsuario(userUuid: string): Promise<UsuarioEntity | null> {
    const [usuarioModel] = await this.connectionHub.database!.query(`SELECT * FROM auth_users WHERE uuid = '${userUuid}'`);
    if (!usuarioModel) return null;
    const cartoes = await this.connectionHub.database?.query(
      `SELECT uuid, token
      FROM financeiro_cartao_credito
      WHERE deleted_at IS NULL
        AND user_uuid = $1`,
      [userUuid],
    );
    return new UsuarioEntity({
      uuid: userUuid,
      cartoes,
    });
  }

  async savarCobranca(cobranca: CobrancaEntity, quantidadeParcelas: number): Promise<void> {
    await this.connectionHub.database!.query(
      `INSERT INTO financeiro_cobrancas (uuid, company_uuid, user_uuid, origem_tipo, origem_uuid, pagador_nome, pagador_documento, pagador_email, pagador_telefone, valor, banco_ref, pagamentos_quantidade)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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
        quantidadeParcelas,
      ],
    );
  }

  async savarPagamentos(cobranca: CobrancaEntity, pagamentos: PagamentoEntity[]): Promise<void> {
    for (const pagamento of pagamentos) {
      await this.connectionHub.database!.query(
        `INSERT INTO financeiro_pagamentos (
          uuid,
          company_uuid,
          user_uuid,
          cobanca_uuid,
          forma_pagamento,
          vencimento,
          valor,
          valor_com_desc_gateway,
          valor_pago,
          banco_ref,
          nosso_numero,
          link_boleto,
          codigo_barras,
          linha_digitavel,
          pix,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          randomUUID(),
          cobranca.companyUuid(),
          cobranca.userUuid(),
          cobranca.uuid(),
          cobranca.tipoCobranca(),
          pagamento.vencimento(),
          pagamento.valor(),
          pagamento.valorComDescGateway(),
          pagamento.valorPago(),
          pagamento.bancoRef(),
          pagamento.nossoNumero(),
          pagamento.linkBoleto(),
          pagamento.codigoBarras(),
          pagamento.linhaDigitavel(),
          pagamento.pix(),
          pagamento.status() ?? "pendente",
        ],
      );
    }
  }

  async setarCartaoAtual(cobranca: CobrancaEntity, cartaoUuid: string) {
    await this.connectionHub.database!.query(
      `UPDATE financeiro_cartao_credito
      SET atual = false
      WHERE user_uuid = '${cobranca.userUuid()}'`,
    );
    await this.connectionHub.database!.query(
      `UPDATE financeiro_cartao_credito
      SET atual = true
      WHERE user_uuid = '${cobranca.userUuid()}'
        AND uuid = '${cartaoUuid}'`,
    );
  }
}
