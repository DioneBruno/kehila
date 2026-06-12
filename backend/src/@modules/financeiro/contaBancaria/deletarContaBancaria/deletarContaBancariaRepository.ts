import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class DeletarContaBancariaRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async existe(companyUuid: string, contaBancariaUuid: string): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(
      `SELECT uuid FROM financeiro_contas_bancarias WHERE uuid = $1 AND company_uuid = $2 AND deleted_at IS NULL`,
      [contaBancariaUuid, companyUuid],
    );
    return !!row;
  }

  async deletar(companyUuid: string, contaBancariaUuid: string): Promise<void> {
    await this.connectionHub.database!.query(
      `UPDATE financeiro_contas_bancarias SET deleted_at = now() WHERE uuid = $1 AND company_uuid = $2`,
      [contaBancariaUuid, companyUuid],
    );
  }
}
