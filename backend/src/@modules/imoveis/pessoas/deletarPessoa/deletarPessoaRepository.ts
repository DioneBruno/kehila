import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class DeletarPessoaRepository {
  constructor(readonly connections: ConnectionHub) {}

  async existe(companyUuid: string, uuid: string): Promise<boolean> {
    const [row] = await this.connections.database.query(
      `SELECT uuid FROM imovel_pessoas WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`,
      [companyUuid, uuid],
    );
    return !!row;
  }

  async deletar(companyUuid: string, uuid: string): Promise<void> {
    await this.connections.database.query(
      `UPDATE imovel_pessoas SET deleted_at = now(), updated_at = now() WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`,
      [companyUuid, uuid],
    );
  }
}
