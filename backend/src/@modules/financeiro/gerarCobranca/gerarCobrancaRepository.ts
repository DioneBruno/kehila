import { ConnectionHub } from "../../shared/connections/connectionHub";
import { CobrancaEntity } from "./cobranca.entity";
import { GerarCobrancaGatewayAsaas } from "./gerarCorbancaGateway.asaas";

export class GerarCobrancaRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  buscarGateway() {
    const gateway = new GerarCobrancaGatewayAsaas(this.connectionHub);
    return gateway;
  }

  async savarCobranca(cobranca: CobrancaEntity): Promise<void> {
    await this.connectionHub.database.query(
      `INSERT INTO
      financeiro_cobrancas (uuid, company_uuid, user_uuid, origem_tipo, origem_uuid, pagador_nome, pagador_documento, pagador_email, pagador_telefone, valor)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
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
      ],
    );
  }
}
