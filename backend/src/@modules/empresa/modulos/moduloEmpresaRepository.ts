import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class ModuloEmpresaRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async listarModulos(companyUuid: string): Promise<string[]> {
    const rows = await this.connectionHub.database!.query(
      `SELECT modulo FROM auth_company_modulos WHERE company_uuid = $1 AND deleted_at IS NULL ORDER BY modulo`,
      [companyUuid],
    );
    return rows.map((row: { modulo: string }) => row.modulo);
  }
}
