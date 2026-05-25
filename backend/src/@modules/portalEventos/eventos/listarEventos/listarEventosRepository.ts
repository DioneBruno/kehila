import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type EventoListItem = {
  uuid: string;
  titulo: string;
  slug: string;
  bannerUrl: string | null;
  dataInicio: string;
  dataFim: string | null;
  localNome: string | null;
  online: boolean;
  status: string;
  capacidadeTotal: number | null;
};

export type ListarEventosParams = {
  companyUuid: string;
  status?: string;
  busca?: string;
  pagina: number;
  porPagina: number;
};

export type ListarEventosResult = {
  dados: EventoListItem[];
  total: number;
};

export class ListarEventosRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async listar(params: ListarEventosParams): Promise<ListarEventosResult> {
    const { companyUuid, status, busca, pagina, porPagina } = params;
    const offset = (pagina - 1) * porPagina;

    const filterBindings: unknown[] = [companyUuid];
    let filterWhere = `WHERE e.deleted_at IS NULL AND e.company_uuid = $1`;
    let idx = 2;

    if (status) {
      filterWhere += ` AND e.status = $${idx}`;
      filterBindings.push(status);
      idx++;
    }

    if (busca) {
      filterWhere += ` AND e.titulo ILIKE $${idx}`;
      filterBindings.push(`%${busca}%`);
      idx++;
    }

    const [countRow] = await this.connectionHub.database.query(`SELECT COUNT(*) AS total FROM eventos e ${filterWhere}`, filterBindings);

    const rows = await this.connectionHub.database.query(
      `
      SELECT
        e.uuid,
        e.titulo,
        e.slug,
        e.banner_url AS "bannerUrl",
        e.data_inicio AS "dataInicio",
        e.data_fim AS "dataFim",
        e.local_nome AS "localNome",
        e.online,
        e.status,
        e.capacidade_total AS "capacidadeTotal"
      FROM eventos e
      ${filterWhere}
      ORDER BY e.data_inicio DESC
      LIMIT $${idx} OFFSET $${idx + 1}
      `,
      [...filterBindings, porPagina, offset],
    );

    return {
      dados: rows,
      total: parseInt(countRow.total, 10),
    };
  }
}
