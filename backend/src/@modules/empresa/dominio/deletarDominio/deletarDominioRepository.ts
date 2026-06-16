import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class DeletarDominioRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async existe(companyUuid: string, dominioUuid: string): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(
      `SELECT uuid FROM auth_company_domains WHERE uuid = $1 AND company_uuid = $2 AND deleted_at IS NULL`,
      [dominioUuid, companyUuid],
    );
    return !!row;
  }

  async deletar(companyUuid: string, dominioUuid: string): Promise<void> {
    await this.connectionHub.database!.query(
      `UPDATE auth_company_domains SET deleted_at = now() WHERE uuid = $1 AND company_uuid = $2`,
      [dominioUuid, companyUuid],
    );
  }
}
