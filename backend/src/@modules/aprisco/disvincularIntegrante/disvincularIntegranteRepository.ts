import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class DisvincularIntegranteRepository {
  constructor(readonly connections: ConnectionHub) {}

  async integranteExiste(companyUuid: string, apriscoUuid: string, integranteUuid: string): Promise<boolean> {
    const [row] = await this.connections.database.query(
      `SELECT uuid FROM aprisco_integrantes WHERE deleted_at IS NULL AND company_uuid = $1 AND aprisco_uuid = $2 AND uuid = $3`,
      [companyUuid, apriscoUuid, integranteUuid],
    );
    return !!row;
  }

  async disvincular(companyUuid: string, apriscoUuid: string, integranteUuid: string): Promise<void> {
    await this.connections.database.query(
      `
      UPDATE aprisco_integrantes SET deleted_at = now(), updated_at = now()
      WHERE deleted_at IS NULL AND company_uuid = $1 AND aprisco_uuid = $2 AND uuid = $3
      `,
      [companyUuid, apriscoUuid, integranteUuid],
    );
  }
}
