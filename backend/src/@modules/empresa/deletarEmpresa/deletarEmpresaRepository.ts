import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class DeletarEmpresaRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async existe(companyUuid: string): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(
      `SELECT uuid FROM auth_companies WHERE uuid = $1 AND deleted_at IS NULL`,
      [companyUuid],
    );
    return !!row;
  }

  async deletar(companyUuid: string): Promise<void> {
    await this.connectionHub.database!.query(`UPDATE auth_companies SET deleted_at = now() WHERE uuid = $1`, [
      companyUuid,
    ]);
  }
}
