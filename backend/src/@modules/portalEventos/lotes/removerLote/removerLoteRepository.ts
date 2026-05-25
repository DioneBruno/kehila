import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class RemoverLoteRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscar(uuid: string, companyUuid: string): Promise<{ uuid: string; vendidosTotal: number } | null> {
    const [row] = await this.connectionHub.database.query(
      `
      SELECT
        l.uuid,
        COALESCE(SUM(t.vendidos), 0) AS "vendidosTotal"
      FROM evento_lotes l
      LEFT JOIN evento_lote_tipos_ingresso t ON t.lote_uuid = l.uuid
      WHERE l.uuid = $1 AND l.company_uuid = $2
      GROUP BY l.uuid
      `,
      [uuid, companyUuid],
    );
    if (!row) return null;
    return { uuid: row.uuid, vendidosTotal: parseInt(row.vendidosTotal, 10) };
  }

  async remover(uuid: string, companyUuid: string): Promise<void> {
    await this.connectionHub.database.query(`DELETE FROM evento_lotes WHERE uuid = $1 AND company_uuid = $2`, [uuid, companyUuid]);
  }
}
