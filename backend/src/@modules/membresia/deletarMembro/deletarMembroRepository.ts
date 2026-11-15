import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class DeletarMembroRepository {
  constructor(readonly connections: ConnectionHub) {}

  async existe(companyUuid: string, membroUuid: string): Promise<boolean> {
    const [row] = await this.connections.database.query(
      `SELECT uuid FROM auth_pessoas WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`,
      [companyUuid, membroUuid],
    );
    return !!row;
  }

  async deletar(companyUuid: string, membroUuid: string): Promise<void> {
    await this.connections.database.query(`UPDATE auth_pessoas SET deleted_at = now(), updated_at = now() WHERE company_uuid = $1 AND uuid = $2`, [
      companyUuid,
      membroUuid,
    ]);
  }
}
