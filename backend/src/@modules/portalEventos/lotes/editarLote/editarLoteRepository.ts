import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type EditarLoteData = {
  uuid: string;
  companyUuid: string;
  nome: string;
  ordem: number;
  quantidade: number;
  preco: number;
  dataInicio?: string;
  dataFim?: string;
  ativo: boolean;
};

export class EditarLoteRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscar(uuid: string, companyUuid: string): Promise<{ uuid: string; vendidosTotal: number } | null> {
    const [row] = await this.connectionHub.database!.query(
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

  async editar(data: EditarLoteData): Promise<void> {
    await this.connectionHub.database!.query(
      `
      UPDATE evento_lotes SET
        nome = $1, ordem = $2, quantidade = $3, preco = $4,
        data_inicio = $5, data_fim = $6, ativo = $7, updated_at = now()
      WHERE uuid = $8 AND company_uuid = $9
      `,
      [data.nome, data.ordem, data.quantidade, data.preco, data.dataInicio ?? null, data.dataFim ?? null, data.ativo, data.uuid, data.companyUuid],
    );
  }
}
