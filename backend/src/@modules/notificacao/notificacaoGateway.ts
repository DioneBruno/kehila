import { ConnectionHub } from "../shared/connections/connectionHub";
import { randomUUID } from "crypto";

export class NotificacaoGateway {
  constructor(readonly connections: ConnectionHub) {}

  async salvarGateway(companyUuid: string, gateway: any) {
    await this.connections.database?.query(`INSERT INTO notificacao_gateways (uuid, company_uuid, type, name, usuario, senha, meta, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (uuid) DO UPDATE SET
      usuario = $5,
      senha = $6,
      meta = $7,
      status = $8
      `, [
        gateway.uuid || randomUUID(), companyUuid, gateway.type, gateway.name, gateway.usuario, gateway.senha, gateway.meta, gateway.status
      ]);
  }

  async listarGateways(companyUuid: string) {
    const gatewaysModel = await this.connections.database?.query(`SELECT
        uuid,
        type,
        name,
        usuario,
        meta,
        status
      FROM notificacao_gateways
      WHERE deleted_at IS NULL
        AND company_uuid = $1`, [companyUuid]);
    return gatewaysModel;
  }
}
