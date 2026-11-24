import { buscarSituacaoImovel, imovelTemContratoVigente } from "../situacaoImovel";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class DeletarImovelRepository {
  constructor(readonly connections: ConnectionHub) {}

  buscarSituacao(companyUuid: string, uuid: string) {
    return buscarSituacaoImovel(this.connections, companyUuid, uuid);
  }

  temContratoVigente(companyUuid: string, uuid: string) {
    return imovelTemContratoVigente(this.connections, companyUuid, uuid);
  }

  async deletar(companyUuid: string, uuid: string): Promise<void> {
    await this.connections.database.query(
      `UPDATE imovel_imoveis SET deleted_at = now(), updated_at = now() WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`,
      [companyUuid, uuid],
    );
  }
}
