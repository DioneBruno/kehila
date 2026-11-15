import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class DeletarApriscoRepository {
  constructor(readonly connections: ConnectionHub) {}

  async existe(companyUuid: string, apriscoUuid: string): Promise<boolean> {
    const [row] = await this.connections.database.query(`SELECT uuid FROM apriscos WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`, [
      companyUuid,
      apriscoUuid,
    ]);
    return !!row;
  }

  async deletar(companyUuid: string, apriscoUuid: string): Promise<void> {
    await this.connections.database.query(
      `UPDATE apriscos SET deleted_at = now(), updated_at = now() WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`,
      [companyUuid, apriscoUuid],
    );
  }
}
