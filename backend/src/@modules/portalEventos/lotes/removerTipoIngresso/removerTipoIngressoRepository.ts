import { ConnectionHub } from "src/@modules/shared/connectionHub";

export class RemoverTipoIngressoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscar(uuid: string, companyUuid: string): Promise<{ uuid: string; vendidos: number } | null> {
    const [row] = await this.connectionHub.database.query(
      `SELECT uuid, vendidos FROM evento_lote_tipos_ingresso WHERE uuid = $1 AND company_uuid = $2`,
      [uuid, companyUuid],
    );
    return row ?? null;
  }

  async remover(uuid: string, companyUuid: string): Promise<void> {
    await this.connectionHub.database.query(
      `DELETE FROM evento_lote_tipos_ingresso WHERE uuid = $1 AND company_uuid = $2`,
      [uuid, companyUuid],
    );
  }
}
