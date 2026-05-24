import { ConnectionHub } from "../../shared/connectionHub";
import { CobrancaEntity } from "./cobranca.entity";

export class GerarCobrancaRepository {
  constructor(readonly connectionHub: ConnectionHub) {}
  async savarCobranca(cobranca: CobrancaEntity): Promise<void> {
    await this.connectionHub.database.query(
      `INSERT INTO
      financeiro_cobrancas (uuid, company_uuid, user_uuid, origem_tipo, origem_uuid, valor)
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [cobranca.uuid(), cobranca.companyUuid(), cobranca.userUuid(), cobranca.origem(), cobranca.origemUuid(), cobranca.valor()],
    );
  }
}
